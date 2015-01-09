Ppulse = {}

Ppulse.colors = ['green', 'blue', 'amber', 'orange', 'purple'];

Ppulse.formatTime = function(time, format) {
	if (format == undefined) {
		format = 'hms';
	}

	var hours = Math.floor(time / 3600);
	var minutes = Math.floor((time - hours*3600) / 60 );
	var seconds = Math.floor((time - hours*3600 - minutes*60));

	if (minutes < 10) { minutes = '0' + minutes; }
	if (seconds < 10) { seconds = '0' + seconds; }

	if (format == 'hms') {
		return hours + ':' + minutes + ':' + seconds;	
	} else {
		return hours + ':' + minutes;
	}
}

Ppulse.updateTimer = function(start_time, offset_time) {
	var d = new Date().getTime()/1000;
	return d - start_time + offset_time;
}


Ppulse.dayOffset = function(day) {
	var nday = Math.floor(new Date().getTime()/(1000*3600*24));
	return nday - day;
}



function Pproject(container)
{
	var self = this;
	
	var color = 0;
	var init = 0;
	var times = [0, 0, 0];
	var timer = false;

	// html
	var project = container.addClass('clockin');
	var p = Pproject.prototype.build(project);

	// sortable logic
	var sort = new Sortable(p.tasks[0], {
		animation: 0, // ms, animation speed moving items when sorting, `0` — without animation
		handle: ".clockin_task", // Restricts sort start click/touch to the specified element
	  	draggable: ".clockin_task", // Specifies which items inside the element should be sortable
	  	ghostClass: "sortable_ghost",
	});

	// logic
	project.on('stoptimer', function() {
		if (timer)
		{
			$(this).removeClass('running');
			p.runtimers.removeClass('animate-spin');
			self.stopTimer();
		}
	});

	p.colors.on('click touchstart', function() { self.cycleColor(); })
	p.trash.on('click touchstart', function() { 
		clockin_dialog(
			'Delete project', 
			'<p>Are you sure you wan\'t to delete this project?</p>', 
			'prompt', 
			{
				cancel: 'Abort', 
				affirm: '<span class="icon-trash-1"></span> Delete', 
				fcn: function(){ project.remove(); }
			}
		);
	});
	p.runtimers.on('click touchstart', function() {
		if (timer) {
			$(this).removeClass('animate-spin');
			self.stopTimer();
		} else {
			$(this).addClass('animate-spin');
			self.startTimer();
		}
	});
	p.addtask.on('click touchstart', function() { self.addTask('', 0); })

	// simple functions
	this.getTitle = function() { return p.title.val(); }
	this.setTitle = function(value) { p.title.val(value) }

	this.getDescription = function() { return p.description.text(); }
	this.setDescription = function(value) { p.description.text(value); }

	this.cycleColor = function() { var value = (color + 1) % Ppulse.colors.length; this.setColor(value); }
	this.getColor = function() { return color; }
	this.setColor = function(value) { 
		value = parseInt(value);
		if (isNaN(value) || value < 0) { value = 0; }
		project.removeClass(Ppulse.colors[color]).addClass(Ppulse.colors[value]); 
		color = value; 
	}
	this.setColor(color);

	this.appendTo = function(container) { $(container).append(project); }
	this.remove = function() { project.remove(); }

	this.updateInit = function() {
		init = Math.floor(new Date().getTime()/(3600*1000*24));
		return init;
	}

	if (init === 0) {
		this.updateInit();
	}

	this.addTime = function(value)   { times = $.map( times, function(time, i) { return value + time; }); this.updateTimer(); }
	this.setTime = function(value)   { times = $.map( times, function(time, i) { return value; });        this.updateTimer(); }
	this.setTimes = function(values) { times = $.map( times, function(time, i) { return values[i]; });    this.updateTimer(); }
	this.loopTimes = function(times, init) {
		var off = Ppulse.dayOffset(init);
		var day = new Date().getDay();
		
		if (off > 0) { times[2] = 0; }
		if (off > day) { times[1] = 0; }
	
		return times;
	}

	this.updateLoopTimes = function() { 
		setTimeout(function() { 
			times = self.loopTimes(times, init); 
			self.updateInit();
			self.updateLoopTimes(); 
		}, (init + 1)*3600*1000 + 5000 - new Date().getTime());
	}
	this.updateLoopTimes();

	this.addTask = function(title, state) {
		var oc = 'open', icon = 'icon-check-empty'; if (state == 1) { oc = 'closed'; icon = 'icon-check'; }

		var task = $('<div class="clockin_task clockin_task_' + oc + '" data-state=' + parseInt(state) + '></div>')
			.append($('<input type="text" value="' + title + '"/>'))
			.append($('<a class="clockin_task_delete icon-trash-1"></a>'))
			.append($('<a class="clockin_task_state ' + icon + '"></a>'));

		p.tasks.append(task);
	}

	this.setTimer = function(times) {
		p.totaltimer.text(Ppulse.formatTime(times[0], 'hm'));
		p.weektimer.text(Ppulse.formatTime(times[1], 'hm'));
		p.todaytimer.text(Ppulse.formatTime(times[2]));
	}

	this.updateTimer = function() { this.setTimer(times); }
	this.updateTimer();

	this.startTimer = function() {
		stopAllTimers();
		$('body').addClass('dim');
		project.addClass('running');

		var starttime = new Date().getTime()/1000;
		var offsettimes = times.slice(0);

		var updater = function() {
			times = $.map( times, function(time, i) { return Ppulse.updateTimer( starttime, offsettimes[i]); });
			self.setTimer(times);
		}

		timer =  setInterval(updater, 1000);
	}

	this.stopTimer = function() {
		$('body').removeClass('dim');
		project.removeClass('running');

		clearInterval(timer);
		timer = false;
	}

	this.exportToObject = function() {
		var dump = {};
		dump.title = this.getTitle();
		dump.color = this.getColor();
		dump.time = Math.floor(times[2]);
		dump.week = Math.floor(times[1]);
		dump.total = Math.floor(times[0]);
		dump.desc = this.getDescription();

		var tasks = [];
		$('.clockin_task', p.tasks).each(function(){
			tasks.push([$('input', this).val(), $(this).attr('data-state')]);
		});
		dump.tasks = tasks;
		// dump.offset = self.offset;

		return dump;
	}

	this.loadFromObject = function(dump) {

		times = this.loopTimes([dump.total, dump.week, dump.time], dump.offset)

		this.setTitle(dump.title);
		this.setColor(dump.color);
		this.setDescription(dump.desc);
		this.setTimes(times);

		if ('tasks' in dump)
		{
			for (var i = 0; i < dump.tasks.length; i++)
			{
				this.addTask(dump.tasks[i][0], dump.tasks[i][1]);
			}
		}
	}

	this.loadFromString = function(str) {
		this.loadFromObject($.parseJSON(str));
	}
}

Pproject.prototype.build = function(project) {
	var p = {};

	p.title = $('<input class="clockin_title" type="text" value="" placeholder="Project"/>');
	p.colors = $('<a class="clockin_colors"><span class="icon-brush"></span></a>');
	p.trash = $('<a class="clockin_delete"><span class="icon-trash-1"></span></a>');
	
	p.description = $('<textarea class="clockin_desc"></textarea>');

	p.totaltimer = $('<div class="clockin_ttimer"></div>');
	p.weektimer = $('<div class="clockin_wtimer"></div>');
	p.todaytimer = $('<div class="clockin_timer"></div>');
	p.runtimers = $('<a class="icon-spin2"></a>');

	p.tasks = $('<div class="clockin_tasks"></div>');
	p.addtask = $('<a class="clockin_add_task">add task</a>')
	

	project.append( 
			$('<div class="clockin_controls"></div>')
				.append(p.title).append(p.colors).append(p.trash))
	.append(p.description)
	.append(
		$('<div class="clockin_timers"></div>')
			.append($('<div class="clockin_timers_total">Total</div>')
				.append(p.totaltimer))
			.append($('<div class="clockin_timers_week">This week</div>')
				.append(p.weektimer))
			.append($('<div class="clockin_timers_today">Today</div>')
				.append(p.todaytimer))
			.append($('<div class="clockin_timers_start"></div>')
				.append(p.runtimers)))
	.append(p.tasks)
	.append(p.addtask);

	return p;
}

// delete task
$( document ).on( "click touchstart", ".clockin_task_delete", function( e ) {
	var container = $(this).parent('.clockin_task');
	if ($(this).siblings('input').val() == false) {
		container.remove();
	} else {
		clockin_dialog(
			'Delete task', 
			'<p>Are you sure you wan\'t to delete this task?</p>', 
			'prompt', 
			{
				cancel: 'Abort', 
			 	affirm: '<span class="icon-trash-1"></span> Delete', 
			 	fcn: function(){ container.remove(); }
			}
		);
	}
} ); 

// switch state
$( document ).on('click touchstart', '.clockin_task_state', function( e ){
	var container = $(this).parent('.clockin_task');

	if (container.attr('data-state') == 0) {
		container.attr('data-state', 1);
		container.removeClass('clockin_task_open').addClass('clockin_task_closed');
		$(this).removeClass('icon-check-empty').addClass('icon-check')			
	} else {
		container.attr('data-state', 0);
		container.removeClass('clockin_task_closed').addClass('clockin_task_open');	
		$(this).removeClass('icon-check').addClass('icon-check-empty')
	}
});

function stopAllTimers() {
	$('.clockin').each(function() {
		$(this).trigger('stoptimer');
	});
}

function clockin_dialog(title, content, dtype, options) {
	switch(dtype) {
		case 'warning':
			var ddtype = ' icon-attention';
			break;
		case 'error':
			var ddtype = ' icon-attention';	
			break;
		default:
			var ddtype = ''
	}

	var viewport_width = $(window).width();
	var viewport_height = $(window).height();
	
	var modal_y = Math.round(Math.max(viewport_height/2.5-100, 0));
	var modal_w = Math.min(viewport_width, 400);

	var popup = $('<div class="clockin_popup" id="clockin_popup"></div>');

	var blur = $('<div class="clockin_blur"></div>')
		.on('click touchstart', function(e){
			e.stopPropagation();
			e.preventDefault();
			e.cancelBubble = true;
			popup.remove();
		});

	var dialog = $('<div class="clockin_dialog"></div>')
		.css('margin-top', modal_y - 50 + 'px')
		.css('width', modal_w + 'px');

	var addendum = '';
	switch(dtype) {
		case 'prompt':
			addendum =  $('<div class="center"></div>')
					.append($('<a class="clockin_button red">' + options.affirm + '</a>')
						.on('click touchstart', function(){
							options.fcn();
							$('#clockin_popup').remove();
						})
					)
					.append('<span style="display: inline-block; width: 60px">&nbsp;</span>')
					.append($('<a class="clockin_button">' + options.cancel +'</a>')
						.on('click touchstart', function(){
							$('#clockin_popup').remove();
						})
					);
			break;
		default:
			addendum = ''
	}

	dialog.append($('<div class="clockin_dialog_close">✖</div>')
			.on('click touchstart', function(){
				popup.remove();
			})
		)
		.append($('<div></div>')
			.append($('<div class="clockin_dialog_title'+ ddtype +'""></div>').append(title))
			.append($('<div class="clockin_dialog_content"></div>').append(content).append(addendum))
		)
	
	$('body').append(popup.append(blur).append(dialog));

	window.setTimeout(function(){
		blur.css('opacity', .6);
		dialog.css('opacity', 1).css('margin-top', modal_y + 'px')
	}, 50);
}