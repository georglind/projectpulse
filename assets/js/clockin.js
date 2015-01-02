function Project(container) 
{
	var self = this;

	self.title = false;
	self.time = 0;
	self.week = 0;
	self.total = 0;
	self.offset = Math.floor(new Date().getTime()/(1000*3600*24))
	self.timing = false;
	self.timer = false;
	self.description = false;
	self.tasks = false;
	self.color = 'green';

	var timer = false;
	var offset_time = self.time;

	this.setup = function()
	{
		container.addClass('clockin').addClass(self.color);

		var control_timer = new ToggleButton({text: '', class: 'icon-spin2 animate-spin', fcn: function() { self.start_timer(); }}, 
											 {text: '', class: 'icon-spin2', fcn: function() { self.stop_timer();  }});
	
		self.title = $('<input class="clockin_title" type="text" value="" placeholder="Project"/>')

		var colors = $('<a class="clockin_colors icon-brush"></a>')
			.on('click touchstart', function(){
				container.removeClass(self.color)
				switch(self.color) {
					case 'green':
						self.color = 'blue';
					break;
					case 'blue':
						self.color = 'amber';
					break;
					case 'amber':
						self.color = 'orange';
					break;
					case 'orange':
						self.color = 'purple';
					break;
					case 'purple':
					default:
						self.color = 'green';
					break;
				}
				container.addClass(self.color);
			});

		var del = $('<a class="clockin_delete icon-trash-1"></a>')
			.on('click touchstart', function(){
				clockin_dialog('Delete project', '<p>Are you sure you wan\'t to delete this project?</p>', 'prompt', {cancel: 'Abort', affirm: 'Delete', fcn: function(){ container.remove(); }});
			});

		var controls = $('<div class="clockin_controls"></div>')
			.append(self.title)
			.append(colors)
			.append(del);

		self.ttimer = $('<div class="clockin_ttimer"></div>')
			.text(ClockIn.formatTimer(self.total, 'hm'));
		
		self.wtimer = $('<div class="clockin_wtimer"></div>')
			.text(ClockIn.formatTimer(self.week, 'hm'));

		self.timer = $('<div class="clockin_timer"></div>')
			.text(ClockIn.formatTimer(self.time));

		var timers = $('<div class="clockin_timers"></div>')
			.append($('<div class="clockin_timers_total">Total</div>')
					.append(self.ttimer))
			.append($('<div class="clockin_timers_week">This week</div>')
					.append(self.wtimer))
			.append($('<div class="clockin_timers_today">Today</div>')
					.append(self.timer))
			.append($('<div class="clockin_timers_start"></div>').append(control_timer.button))

		self.tasks = $('<div class="clockin_tasks"></div>');

		self.description = $('<textarea class="clockin_desc"></textarea>');

		var content_controls = $('<a class="clockin_add_task">add task</a>')
			.on('click', function(){
				new Task('', 0).appendTo(self.tasks);
			});

		container
			.append(controls)
			.append(self.description)
			.append(timers)
			.append(self.tasks)
			.append(content_controls);

		var sort = new Sortable(self.tasks[0], {
		  animation: 0, // ms, animation speed moving items when sorting, `0` — without animation
		  handle: ".clockin_task", // Restricts sort start click/touch to the specified element
	  	  draggable: ".clockin_task", // Specifies which items inside the element should be sortable
	  	  ghostClass: "sortable_ghost",
		});

		offset_time = self.time;
	}


	this.start_timer = function()
	{
		var start_time = new Date().getTime()/1000;
		var offset_time = self.time;

		var updater = function()
		{
			self.time = ClockIn.updateTimer(start_time, offset_time);
			self.timer.text(ClockIn.formatTimer(self.time));

			self.wtimer.text(ClockIn.formatTimer(self.time+self.week-offset_time, 'hm'))
			self.ttimer.text(ClockIn.formatTimer(self.time+self.total-offset_time, 'hm'))
		}

		self.timing = setInterval(updater, 1000);
	}


	this.stop_timer = function()
	{
		clearInterval(self.timing);
		self.timing = false;
	}


	this.dump = function()
	{
		var dump = {};
		dump.title = self.title.val();
		dump.color = self.color;
		dump.time = Math.floor(self.time);
		dump.week = self.week + Math.floor(self.time) - offset_time;
		dump.total = self.total + Math.floor(self.time) - offset_time;
		dump.desc = self.description.val();

		var tasks = [];
		$('.clockin_task', container).each(function(){
			tasks.push([$('input', this).val(), $(this).attr('data-state')]);
		});
		dump.tasks = tasks;
		// for (var i = 0; i < self.tasks.length; i++) {
			// tasks.push(self.tasks[i].dump());
		// }

		// dump.tasks = tasks;
		dump.offset = self.offset;

		return dump;
	}


	this.load_from_object = function(dump)
	{
		self.total = dump.total;
		self.week = dump.week;

		var off = ClockIn.dayOffset(dump.offset);
		var day = new Date().getDay();
		
		if (off > 0)
		{
			// this week
			if (off < day) 
			{
				self.week += self.time;
			}
			// last week
			if (off < 7 + day) 
			{
				self.week = self.time;
			}
			dump.time = 0;
		}
		self.time = dump.time;
		offset_time = self.time;
		
		self.offset = dump.offset + off;
		
		self.color = dump.color;

		// setup
		self.setup();
	
		self.title.val(dump.title);
		self.description.val(dump.desc);

		if ('tasks' in dump)
		{
			for (var i = 0; i < dump.tasks.length; i++)
			{
				new Task(dump.tasks[i][0], dump.tasks[i][1]).appendTo(self.tasks);
			}
		}
	}
}


var ClockIn = {};

ClockIn.formatTimer = function(time, format) 
{
	if (format == undefined)
	{
		format = 'hms';
	}

	var hours = Math.floor(time / 3600);
	var minutes = Math.floor((time - hours*3600) / 60 );
	var seconds = Math.floor((time - hours*3600 - minutes*60));

	if (minutes < 10) { minutes = '0' + minutes; }
	if (seconds < 10) { seconds = '0' + seconds; }

	if (format == 'hms')
	{
		return hours + ':' + minutes + ':' + seconds;	
	}
	else 
	{
		return hours + ':' + minutes;
	}
	
}

ClockIn.updateTimer = function(start_time, offset_time)
{
	var d = new Date().getTime()/1000;
	return d - start_time + offset_time;
}


ClockIn.dayOffset = function(day){
	var nday = Math.floor(new Date().getTime()/(1000*3600*24))
	return nday - day;
}


function Task(title, state)
{	
	var oc = 'open';
	if (state == 1) { oc = 'closed'}

	var container = $('<div class="clockin_task clockin_task_' + oc + '" data-state=' + parseInt(state) + '></div>');
	var title = $('<input type="text" value="' + title + '"/>');
	var del = $('<a class="clockin_task_delete icon-trash-1"></a>')
		.on('click touchstart', function(){
			if (title.val() == '')
			{
				container.remove();
			}
			else 
			{
				clockin_dialog('Delete task', '<p>Are you sure you wan\'t to delete this task?</p>', 'prompt', {cancel: 'Abort', affirm: 'Delete', fcn: function(){ container.remove(); }});
			}
		});

	var icon = 'icon-check-empty';
	if (state == 1) { icon = 'icon-check'; }

	var state_toggle = $('<a class="clockin_task_state ' + icon + '"></a>')
		.on('click touchstart', function(){
			if (container.attr('data-state') == 0)
			{
				container.attr('data-state', 1);
				container.removeClass('clockin_task_open').addClass('clockin_task_closed');
				$(this).removeClass('icon-check-empty').addClass('icon-check')
				
			}
			else
			{
				container.attr('data-state', 0);
				container.removeClass('clockin_task_closed').addClass('clockin_task_open');	
				$(this).removeClass('icon-check').addClass('icon-check-empty')
			}
		});
		

	container.append(title).append(del).append(state_toggle); 

	this.appendTo = function(wrap) 
	{
		wrap.append(container);
	}
}


function ToggleButton(toggle_on, toggle_off) {

	var self = this;

	self.state = true;
	self.on = toggle_on;
	self.off = toggle_off;
	self.button = $('<a>' + toggle_off['text'] + '</a>').addClass(self.off.class)

	function toggle() 
	{	
		if (self.state) 
		{
			if ('fcn' in self.on) 
			{
				self.on.fcn()
			}
			if ('text' in self.on)
			{
				self.button.text(self.on['text']);
			}
			if ('class' in self.off)
			{
					self.button.removeClass(self.off['class']);
			}
			if ('class' in self.on)
			{	
				self.button.addClass(self.on['class']);
			}
		}
		else
		{
			if ('fcn' in self.off) 
			{
				self.off.fcn();
			}
			if ('text' in self.off)
			{
				self.button.text(self.off['text']);
			}
			if ('class' in self.on)
			{
				self.button.removeClass(self.on['class']);
			}
			if ('class' in self.off)
			{
				self.button.addClass(self.off['class']);
			}
		}

		self.state = !self.state;
	}

	self.button.on('click', toggle);
}

function clockin_dialog(title, content, dtype, options) 
{
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
	},20);
}