// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklebatchprotect.js: Batch protect module (sysops only)
 ****************************************
 * Mode of invocation:     Tab ("P-batch")
 * Active on:              Existing project pages and user pages; existing and
 *                         non-existing categories; Special:PrefixIndex
 */


TwinkleGlobal.batchprotect = function twinklebatchprotect() {
	if (MorebitsGlobal.userIsSysop && ((mw.config.get('wgArticleId') > 0 && (mw.config.get('wgNamespaceNumber') === 2 ||
		mw.config.get('wgNamespaceNumber') === 4)) || mw.config.get('wgNamespaceNumber') === 14 ||
		mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex')) {
		TwinkleGlobal.addPortletLink(TwinkleGlobal.batchprotect.callback, 'P-batch', 'twg-pbatch', 'Protect pages linked from this page');
	}
};

TwinkleGlobal.batchprotect.unlinkCache = {};
TwinkleGlobal.batchprotect.callback = function twinklebatchprotectCallback() {
	var Window = new MorebitsGlobal.simpleWindow(600, 400);
	Window.setTitle('Batch protection');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Protection policy', 'WP:PROT');
	Window.addFooterLink('Twinkle help', 'WP:TW/DOC#protect');

	var form = new MorebitsGlobal.quickForm(TwinkleGlobal.batchprotect.callback.evaluate);
	form.append({
		type: 'checkbox',
		name: 'editmodify',
		event: TwinkleGlobal.protect.formevents.editmodify,
		list: [
			{
				label: 'Modify edit protection',
				value: 'editmodify',
				tooltip: 'Only for existing pages.',
				checked: true
			}
		]
	});
	var editlevel = form.append({
		type: 'select',
		name: 'editlevel',
		label: 'Edit protection:',
		event: TwinkleGlobal.protect.formevents.editlevel
	});
	editlevel.append({
		type: 'option',
		label: 'All',
		value: 'all'
	});
	editlevel.append({
		type: 'option',
		label: 'Autoconfirmed',
		value: 'autoconfirmed'
	});
	editlevel.append({
		type: 'option',
		label: 'Extended confirmed',
		value: 'extendedconfirmed'
	});
	editlevel.append({
		type: 'option',
		label: 'Template editor',
		value: 'templateeditor'
	});
	editlevel.append({
		type: 'option',
		label: 'Sysop',
		value: 'sysop',
		selected: true
	});
	form.append({
		type: 'select',
		name: 'editexpiry',
		label: 'Expires:',
		event: function(e) {
			if (e.target.value === 'custom') {
				TwinkleGlobal.protect.doCustomExpiry(e.target);
			}
		},
		list: [
			{ label: '1 hour', value: '1 hour' },
			{ label: '2 hours', value: '2 hours' },
			{ label: '3 hours', value: '3 hours' },
			{ label: '6 hours', value: '6 hours' },
			{ label: '12 hours', value: '12 hours' },
			{ label: '1 day', value: '1 day' },
			{ label: '2 days', selected: true, value: '2 days' },
			{ label: '3 days', value: '3 days' },
			{ label: '4 days', value: '4 days' },
			{ label: '1 week', value: '1 week' },
			{ label: '2 weeks', value: '2 weeks' },
			{ label: '1 month', value: '1 month' },
			{ label: '2 months', value: '2 months' },
			{ label: '3 months', value: '3 months' },
			{ label: '1 year', value: '1 year' },
			{ label: 'indefinite', value: 'indefinite' },
			{ label: 'Custom...', value: 'custom' }
		]
	});

	form.append({
		type: 'checkbox',
		name: 'movemodify',
		event: TwinkleGlobal.protect.formevents.movemodify,
		list: [
			{
				label: 'Modify move protection',
				value: 'movemodify',
				tooltip: 'Only for existing pages.',
				checked: true
			}
		]
	});
	var movelevel = form.append({
		type: 'select',
		name: 'movelevel',
		label: 'Move protection:',
		event: TwinkleGlobal.protect.formevents.movelevel
	});
	movelevel.append({
		type: 'option',
		label: 'All',
		value: 'all'
	});
	movelevel.append({
		type: 'option',
		label: 'Extended confirmed',
		value: 'extendedconfirmed'
	});
	movelevel.append({
		type: 'option',
		label: 'Template editor',
		value: 'templateeditor'
	});
	movelevel.append({
		type: 'option',
		label: 'Sysop',
		value: 'sysop',
		selected: true
	});
	form.append({
		type: 'select',
		name: 'moveexpiry',
		label: 'Expires:',
		event: function(e) {
			if (e.target.value === 'custom') {
				TwinkleGlobal.protect.doCustomExpiry(e.target);
			}
		},
		list: [
			{ label: '1 hour', value: '1 hour' },
			{ label: '2 hours', value: '2 hours' },
			{ label: '3 hours', value: '3 hours' },
			{ label: '6 hours', value: '6 hours' },
			{ label: '12 hours', value: '12 hours' },
			{ label: '1 day', value: '1 day' },
			{ label: '2 days', selected: true, value: '2 days' },
			{ label: '3 days', value: '3 days' },
			{ label: '4 days', value: '4 days' },
			{ label: '1 week', value: '1 week' },
			{ label: '2 weeks', value: '2 weeks' },
			{ label: '1 month', value: '1 month' },
			{ label: '2 months', value: '2 months' },
			{ label: '3 months', value: '3 months' },
			{ label: '1 year', value: '1 year' },
			{ label: 'indefinite', value: 'indefinite' },
			{ label: 'Custom...', value: 'custom' }
		]
	});

	form.append({
		type: 'checkbox',
		name: 'createmodify',
		event: function twinklebatchprotectFormCreatemodifyEvent(e) {
			e.target.form.createlevel.disabled = !e.target.checked;
			e.target.form.createexpiry.disabled = !e.target.checked || (e.target.form.createlevel.value === 'all');
			e.target.form.createlevel.style.color = e.target.form.createexpiry.style.color = e.target.checked ? '' : 'transparent';
		},
		list: [
			{
				label: 'Modify create protection',
				value: 'createmodify',
				tooltip: 'Only for pages that do not exist.',
				checked: true
			}
		]
	});
	var createlevel = form.append({
		type: 'select',
		name: 'createlevel',
		label: 'Create protection:',
		event: TwinkleGlobal.protect.formevents.createlevel
	});
	createlevel.append({
		type: 'option',
		label: 'All',
		value: 'all'
	});
	createlevel.append({
		type: 'option',
		label: 'Autoconfirmed',
		value: 'autoconfirmed'
	});
	createlevel.append({
		type: 'option',
		label: 'Extended confirmed',
		value: 'extendedconfirmed'
	});
	createlevel.append({
		type: 'option',
		label: 'Template editor',
		value: 'templateeditor'
	});
	createlevel.append({
		type: 'option',
		label: 'Sysop',
		value: 'sysop',
		selected: true
	});
	form.append({
		type: 'select',
		name: 'createexpiry',
		label: 'Expires:',
		event: function(e) {
			if (e.target.value === 'custom') {
				TwinkleGlobal.protect.doCustomExpiry(e.target);
			}
		},
		list: [
			{ label: '1 hour', value: '1 hour' },
			{ label: '2 hours', value: '2 hours' },
			{ label: '3 hours', value: '3 hours' },
			{ label: '6 hours', value: '6 hours' },
			{ label: '12 hours', value: '12 hours' },
			{ label: '1 day', value: '1 day' },
			{ label: '2 days', value: '2 days' },
			{ label: '3 days', value: '3 days' },
			{ label: '4 days', value: '4 days' },
			{ label: '1 week', value: '1 week' },
			{ label: '2 weeks', value: '2 weeks' },
			{ label: '1 month', value: '1 month' },
			{ label: '2 months', value: '2 months' },
			{ label: '3 months', value: '3 months' },
			{ label: '1 year', value: '1 year' },
			{ label: 'indefinite', selected: true, value: 'indefinite' },
			{ label: 'Custom...', value: 'custom' }
		]
	});

	form.append({
		type: 'header',
		label: ''  // horizontal rule
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: 'Reason: ',
		size: 60,
		tooltip: 'For the protection log and page history.'
	});

	var query = {
		action: 'query',
		prop: 'revisions|info',
		rvprop: 'size',
		inprop: 'protection'
	};

	if (mw.config.get('wgNamespaceNumber') === 14) {  // categories
		query.generator = 'categorymembers';
		query.gcmtitle = mw.config.get('wgPageName');
		query.gcmlimit = TwinkleGlobal.getPref('batchMax'); // the max for sysops
	} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex') {
		query.generator = 'allpages';
		query.gapnamespace = mw.util.getParamValue('namespace') || $('select[name=namespace]').val();
		query.gapprefix = MorebitsGlobal.string.toUpperCaseFirstChar(mw.util.getParamValue('from') ? mw.util.getParamValue('from').replace('+', ' ') : $('input[name=prefix]').val());
		query.gaplimit = TwinkleGlobal.getPref('batchMax');
	} else {
		query.generator = 'links';
		query.titles = mw.config.get('wgPageName');
		query.gpllimit = TwinkleGlobal.getPref('batchMax'); // the max for sysops
	}

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	MorebitsGlobal.status.init(statusdiv);
	Window.display();

	var statelem = new MorebitsGlobal.status('Grabbing list of pages');

	var wikipedia_api = new MorebitsGlobal.wiki.api('loading...', query, function(apiobj) {
		var xml = apiobj.responseXML;
		var $pages = $(xml).find('page');
		var list = [];
		$pages.each(function(index, page) {
			var $page = $(page);
			var title = $page.attr('title');
			var isRedir = $page.attr('redirect') === ''; // XXX ??
			var missing = $page.attr('missing') === ''; // XXX ??
			var size = $page.find('rev').attr('size');
			var $editProt;

			var metadata = [];
			if (missing) {
				metadata.push('page does not exist');
				$editProt = $page.find('pr[type="create"][level="sysop"]');
			} else {
				if (isRedir) {
					metadata.push('redirect');
				}
				metadata.push(size + ' bytes');
				$editProt = $page.find('pr[type="edit"][level="sysop"]');
			}
			if ($editProt.length > 0) {
				metadata.push('fully' + (missing ? ' create' : '') + ' protected' + ($editProt.attr('expiry') === 'infinity' ? ' indefinitely' : ', expires ' + $editProt.attr('expiry')));
			}

			list.push({ label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''), value: title, checked: true, style: $editProt.length > 0 ? 'color:red' : '' });
		});
		form.append({ type: 'header', label: 'Pages to protect' });
		form.append({
			type: 'button',
			label: 'Select All',
			event: function(e) {
				$(MorebitsGlobal.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		form.append({
			type: 'button',
			label: 'Deselect All',
			event: function(e) {
				$(MorebitsGlobal.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		form.append({
			type: 'checkbox',
			name: 'pages',
			list: list
		});
		form.append({ type: 'submit' });

		var result = form.render();
		Window.setContent(result);
	}, statelem);

	wikipedia_api.post();
};

TwinkleGlobal.batchprotect.currentProtectCounter = 0;
TwinkleGlobal.batchprotect.currentprotector = 0;
TwinkleGlobal.batchprotect.callback.evaluate = function twinklebatchprotectCallbackEvaluate(event) {
	MorebitsGlobal.wiki.actionCompleted.notice = 'Batch protection is now complete';

	var form = event.target;

	var numProtected = $(MorebitsGlobal.quickForm.getElements(form, 'pages')).filter(function(index, element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('You are about to act on ' + numProtected + ' fully protected page(s). Are you sure?')) {
		return;
	}

	var pages = form.getChecked('pages');
	var reason = form.reason.value;
	var editmodify = form.editmodify.checked;
	var editlevel = form.editlevel.value;
	var editexpiry = form.editexpiry.value;
	var movemodify = form.movemodify.checked;
	var movelevel = form.movelevel.value;
	var moveexpiry = form.moveexpiry.value;
	var createmodify = form.createmodify.checked;
	var createlevel = form.createlevel.value;
	var createexpiry = form.createexpiry.value;

	if (!reason) {
		alert("You've got to give a reason, you rouge admin!");
		return;
	}

	MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
	MorebitsGlobal.status.init(form);

	if (!pages) {
		MorebitsGlobal.status.error('Error', 'Nothing to protect, aborting');
		return;
	}

	var batchOperation = new MorebitsGlobal.batchOperation('Applying protection settings');
	batchOperation.setOption('chunkSize', TwinkleGlobal.getPref('batchProtectChunks'));
	batchOperation.setOption('preserveIndividualStatusLines', true);
	batchOperation.setPageList(pages);
	batchOperation.run(function(pageName) {
		var query = {
			action: 'query',
			titles: pageName
		};
		var wikipedia_api = new MorebitsGlobal.wiki.api('Checking if page ' + pageName + ' exists', query,
			TwinkleGlobal.batchprotect.callbacks.main, null, batchOperation.workerFailure);
		wikipedia_api.params = {
			page: pageName,
			reason: reason,
			editmodify: editmodify,
			editlevel: editlevel,
			editexpiry: editexpiry,
			movemodify: movemodify,
			movelevel: movelevel,
			moveexpiry: moveexpiry,
			createmodify: createmodify,
			createlevel: createlevel,
			createexpiry: createexpiry,
			batchOperation: batchOperation
		};
		wikipedia_api.post();
	});
};

TwinkleGlobal.batchprotect.callbacks = {
	main: function(apiobj) {
		var xml = apiobj.responseXML;
		var normal = $(xml).find('normalized n').attr('to');
		if (normal) {
			apiobj.params.page = normal;
		}

		var exists = $(xml).find('page').attr('missing') !== '';

		var page = new MorebitsGlobal.wiki.page(apiobj.params.page, 'Protecting ' + apiobj.params.page);
		var takenAction = false;
		if (exists && apiobj.params.editmodify) {
			page.setEditProtection(apiobj.params.editlevel, apiobj.params.editexpiry);
			takenAction = true;
		}
		if (exists && apiobj.params.movemodify) {
			page.setMoveProtection(apiobj.params.movelevel, apiobj.params.moveexpiry);
			takenAction = true;
		}
		if (!exists && apiobj.params.createmodify) {
			page.setCreateProtection(apiobj.params.createlevel, apiobj.params.createexpiry);
			takenAction = true;
		}
		if (!takenAction) {
			MorebitsGlobal.status.warn('Protecting ' + apiobj.params.page, 'page ' + (exists ? 'exists' : 'does not exist') + '; nothing to do, skipping');
			apiobj.params.batchOperation.workerFailure(apiobj);
			return;
		}

		page.setEditSummary(apiobj.params.reason);
		page.protect(apiobj.params.batchOperation.workerSuccess, apiobj.params.batchOperation.workerFailure);
	}
};
})(jQuery);


// </nowiki>
