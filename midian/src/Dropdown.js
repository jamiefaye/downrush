import $ from'./js/jquery-3.2.1.min.js';
// A simple drop-down menu manager which uses classes instead of Ids internally
export default class Dropdown {
	constructor(item, contents, dropfn) {
		this.item = $(item);
		this.showing = false;
		this.dropfn = dropfn;
		var me = this;
		if(contents) this.item.append(contents);
		this.dropbut = this.item.find('.dropbtn');
		this.dropbut.on('click', function (e) {
			me.showing = !me.showing;
			me.item.find('.dropdown-content').toggleClass('show');
			me.dropWatch = function (e) {
				if (e.target.matches('.dropbtn')) return;
				me.closeDropDown();
			};
			$(window).on('click', me.dropWatch);
		});
		$(this.item).find('.dropdown-content').on('click', e=> {
			me.closeDropDown();
			me.dropfn(e);
		});
	}

	closeDropDown() {
		this.item.find(".dropdown-content").removeClass('show');
		$(window).off('click', this.dropWatch);
	}

}; // End of class
