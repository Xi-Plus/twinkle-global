// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklediff.js: Diff module
 ****************************************
 * Mode of invocation:     Tab on non-diff pages ("Last"); tabs on diff pages ("Since", "Since mine", "Current")
 * Active on:              Existing non-special pages
 */

TwinkleGlobal.diff = function twinklediff() {
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	var disabledWikis = $.map(TwinkleGlobal.getPref('diffDisabledWikis'), function(el) {
		return el.value.trim();
	});
	if (disabledWikis.indexOf(mw.config.get('wgDBname')) !== -1) {
		return;
	}

	TwinkleGlobal.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: 'prev'}), 'Last', 'tw-lastdiff', 'Show most recent diff');

	// Show additional tabs only on diff pages
	if (mw.util.getParamValue('diff')) {
		TwinkleGlobal.addPortletLink(function() {
			TwinkleGlobal.diff.evaluate(false);
		}, 'Since', 'tw-since', 'Show difference between last diff and the revision made by previous user');
		TwinkleGlobal.addPortletLink(function() {
			TwinkleGlobal.diff.evaluate(true);
		}, 'Since mine', 'tw-sincemine', 'Show difference between last diff and my last revision');

		var oldid = /oldid=(.+)/.exec($('#mw-diff-ntitle1').find('strong a').first().attr('href'))[1];
		TwinkleGlobal.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), {diff: 'cur', oldid: oldid}), 'Current', 'tw-curdiff', 'Show difference to current revision');
	}
};

TwinkleGlobal.diff.evaluate = function twinklediffEvaluate(me) {

	var user;
	if (me) {
		user = mw.config.get('wgUserName');
	} else {
		var node = document.getElementById('mw-diff-ntitle2');
		if (!node) {
			// nothing to do?
			return;
		}
		user = $(node).find('a').first().text();
	}
	var query = {
		prop: 'revisions',
		action: 'query',
		titles: mw.config.get('wgPageName'),
		rvlimit: 1,
		rvprop: [ 'ids', 'user' ],
		rvstartid: mw.config.get('wgCurRevisionId') - 1, // i.e. not the current one
		rvuser: user
	};
	MorebitsGlobal.status.init(document.getElementById('mw-content-text'));
	var wikipedia_api = new MorebitsGlobal.wiki.api('Grabbing data of initial contributor', query, TwinkleGlobal.diff.callbacks.main);
	wikipedia_api.params = { user: user };
	wikipedia_api.post();
};

TwinkleGlobal.diff.callbacks = {
	main: function(self) {
		var xmlDoc = self.responseXML;
		var revid = $(xmlDoc).find('rev').attr('revid');

		if (!revid) {
			self.statelem.error('no suitable earlier revision found, or ' + self.params.user + ' is the only contributor. Aborting.');
			return;
		}
		window.location = mw.util.getUrl(mw.config.get('wgPageName'), {
			diff: mw.config.get('wgCurRevisionId'),
			oldid: revid
		});
	}
};
})(jQuery);


// </nowiki>
