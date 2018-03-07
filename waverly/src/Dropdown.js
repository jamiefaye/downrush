import $ from'./js/jquery-3.2.1.min.js';
// A simple drop-down menu manager which uses classes instead of Ids internally
export default class Dropdown {
	constructor(item, contents, dropfn) {
		this.item = $(item);
		this.showing = false;
		this.dropfn = dropfn;
		var that = this;
		if(contents) this.item.append(contents);
		this.dropbut = this.item.find('.dropbtn');
		this.dropbut.on('click', function (e) {
			that.showing = !that.showing;
			that.item.find('.dropdown-content').toggleClass('show');
			that.dropWatch = function (e) {
				if (e.target.matches('.dropbtn')) return;
				that.closeDropDown();
			};
			$(window).on('click', that.dropWatch);
		});
		$(this.item).find('.dropdown-content').on('click', e=> {
			that.closeDropDown();
			that.dropfn(e);
		});
	}

	closeDropDown() {
		this.item.find(".dropdown-content").removeClass('show');
		$(window).off('click', this.dropWatch);
	}

}; // End of class
