// <nowiki>


(function($) {


/*
 ****************************************
 *** twinklearv.js: ARV module
 ****************************************
 * Mode of invocation:     Tab ("GARV")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

TwinkleGlobal.arv = function twinklearv() {
	var username = mw.config.get('wgRelevantUserName');
	if (!username || username === mw.config.get('wgUserName')) {
		return;
	}

	var disabledWikis = $.map(TwinkleGlobal.getPref('arvDisabledWikis'), function(el) {
		return el.value.trim();
	});
	if (disabledWikis.indexOf(mw.config.get('wgDBname')) !== -1) {
		return;
	}

	var title = mw.util.isIPAddress(username) ? 'Report IP to stewards' : 'Report user to stewards';

	TwinkleGlobal.addPortletLink(function() {
		TwinkleGlobal.arv.callback(username);
	}, 'GARV', 'twg-arv', title);
};

// Return: header, language, project
TwinkleGlobal.arv.getProject = function () {
	switch (MorebitsGlobal.wikiFamily) {
		case 'wikimedia':
			switch (MorebitsGlobal.wikiLang) {
				case 'commons':
					return ['commons', 'commons', ''];
				case 'meta':
					return ['meta', 'meta', ''];
				case 'species':
					return ['species', 'species', ''];
				case 'incubator':
					return ['incubator', 'incubator', ''];
				default:
					return [MorebitsGlobal.wikiLang + '.wikimedia', MorebitsGlobal.wikiLang, 'wikimedia'];
			}
		case 'mediawiki':
			return ['mediawiki.org', 'mw', ''];
		case 'wikidata':
			return ['wikidata', 'd', ''];
		case 'wikipedia':
			return [MorebitsGlobal.wikiLang + '.wikipedia', MorebitsGlobal.wikiLang, 'w'];
		case 'wikibooks':
			return [MorebitsGlobal.wikiLang + '.wikibooks', MorebitsGlobal.wikiLang, 'b'];
		case 'wikiquote':
			return [MorebitsGlobal.wikiLang + '.wikiquote', MorebitsGlobal.wikiLang, 'q'];
		case 'wiktionary':
			return [MorebitsGlobal.wikiLang + '.wiktionary', MorebitsGlobal.wikiLang, 'wikt'];
		case 'wikinews':
			return [MorebitsGlobal.wikiLang + '.wikinews', MorebitsGlobal.wikiLang, 'n'];
		case 'wikisource':
			return [MorebitsGlobal.wikiLang + '.wikisource', MorebitsGlobal.wikiLang, 's'];
		case 'wikiversity':
			return [MorebitsGlobal.wikiLang + '.wikiversity', MorebitsGlobal.wikiLang, 'v'];
		case 'wikivoyage':
			return [MorebitsGlobal.wikiLang + '.wikivoyage', MorebitsGlobal.wikiLang, 'voy'];
		default:
			return [MorebitsGlobal.wikiLang + '.' + MorebitsGlobal.wikiFamily, MorebitsGlobal.wikiLang, MorebitsGlobal.wikiFamily];
	}
};

TwinkleGlobal.arv.callback = function (uid) {
	var Window = new MorebitsGlobal.simpleWindow(600, 500);
	Window.setTitle('Advance Reporting and Vetting'); // Backronym
	Window.setScriptName('Twinkle');
	Window.addFooterLink('Add custom reason', TwinkleGlobal.getPref('configPage'));
	Window.addFooterLink('Suggest useful reasons', TwinkleGlobal.getPref('bugReportLink'));
	if (mw.util.isIPAddress(uid)) {
		Window.addFooterLink('Global blocks', 'm:Global blocks');
	} else {
		Window.addFooterLink('Global locks', 'm:Global locks');
	}
	var isIP = mw.util.isIPAddress(uid);
	// form initialise
	var form = new MorebitsGlobal.quickForm(TwinkleGlobal.arv.callback.evaluate);
	var categories = form.append({
		type: 'select',
		name: 'category',
		label: 'Select report type: ',
		event: TwinkleGlobal.arv.callback.changeCategory
	});
	categories.append({
		type: 'option',
		label: isIP ? 'Global block (m:SRG)' : 'Global lock (m:SRG)',
		value: 'global'
	});
	if (MorebitsGlobal.wiki.isGSWiki()) {
		categories.append({
			type: 'option',
			label: 'Global sysops/Requests (m:GS/R)',
			value: 'gsr'
		});
	}
	if (!isIP) {
		categories.append({
			type: 'option',
			label: 'Checkuser (m:SRCU)',
			value: 'srcu'
		});
	}
	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({ type: 'submit' });
	form.append({
		type: 'hidden',
		name: 'uid',
		value: uid
	});

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};

TwinkleGlobal.arv.callback.changeCategory = function (e) {
	var value = e.target.value;
	var root = e.target.form;
	var old_area = MorebitsGlobal.quickForm.getElements(root, 'work_area')[0];
	var work_area = null;
	var username = mw.config.get('wgRelevantUserName');

	switch (value) {
		case 'global':
		/* falls through */
		default:
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: mw.util.isIPAddress(username)
					? 'Request for global block' : 'Request for global lock',
				name: 'work_area'
			});
			if (mw.util.isIPAddress(username)) {
				work_area.append({
					type: 'input',
					name: 'header',
					label: 'Header: Global block for ',
					value: '[[Special:Contributions/' + username + '|' + username + ']]',
					size: 50
				});
				work_area.append({
					type: 'dyninput',
					name: 'username',
					label: 'IPs',
					sublabel: 'IP: ',
					tooltip: 'Without the User:-prefix',
					min: 1
				});
			} else {
				work_area.append({
					type: 'input',
					name: 'header',
					label: 'Header: Global lock for ',
					value: '[[User:' + username + '|' + username + ']]',
					size: 50
				});
				work_area.append({
					type: 'dyninput',
					name: 'username',
					label: 'Usernames',
					sublabel: 'Username: ',
					tooltip: 'Without the User:-prefix',
					min: 1
				});
				work_area.append({
					type: 'checkbox',
					list: [
						{
							label: 'Hide username',
							tooltip: 'Check it if you do not want the name to be visible on this page',
							name: 'hidename',
							value: 'hidename',
							event: TwinkleGlobal.arv.callback.changeHidename
						}
					]
				});
			}
			work_area.append({
				type: 'header',
				label: 'Comment: '
			});
			work_area.append({
				type: 'checkbox',
				name: 'globaltype',
				list: [
					{
						label: 'Long-term abuse',
						value: 'Long-term abuse'
					},
					{
						label: 'Cross-wiki abuse',
						value: 'Cross-wiki abuse'
					},
					{
						label: 'Abusive username',
						value: 'Abusive username'
					},
					{
						label: 'Spam / spambot',
						value: 'Spam / spambot'
					}
				].concat(TwinkleGlobal.getPref('customSRGReasonList'))
			});
			work_area.append({
				type: 'textarea',
				name: 'reason'
			});
			work_area = work_area.render();
			$('input:text[name=username]', work_area).first().val(username);
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'gsr':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Report user to Global sysops/Requests',
				name: 'work_area'
			});
			work_area.append({
				type: 'header',
				label: 'Comment: '
			});
			work_area.append({
				type: 'checkbox',
				name: 'gsrtype',
				list: [
					{
						label: 'Vandalism',
						value: 'Vandalism'
					},
					{
						label: 'Spam / spambot',
						value: 'Spam / spambot'
					}
				].concat(TwinkleGlobal.getPref('customGARVGSRReasonList'))
			});
			work_area.append({
				type: 'textarea',
				name: 'reason'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		case 'srcu':
			work_area = new MorebitsGlobal.quickForm.element({
				type: 'field',
				label: 'Request for checkuser',
				name: 'work_area'
			});

			// Beta feature
			work_area.append({
				type: 'div',
				label: 'This is a beta feature. Remember to review your edits after clicking "Submit query".',
				style: 'color: orange; font-weight: bold;'
			});

			var localCheckuser = [
				/* Wikimedia */ 'metawiki', 'commonswiki', 'specieswiki', 'wikidatawiki',
				/* Wikipedia L1 */ 'arwiki', 'bnwiki', 'cawiki', 'cswiki', 'dawiki', 'dewiki', 'enwiki', 'eswiki',
				/* Wikipedia L2 */ 'fawiki', 'fiwiki', 'frwiki', 'hewiki', 'hrwiki', 'huwiki', 'idwiki', 'itwiki',
				/* Wikipedia L3 */ 'jawiki', 'kowiki', 'mlwiki', 'nlwiki', 'plwiki', 'ptwiki', 'ruwiki', 'simplewiki',
				/* Wikipedia L4 */ 'slwiki', 'srwiki', 'svwiki', 'thwiki', 'trwiki', 'ukwiki', 'viwiki',
				/* Others */ 'enwikibooks', 'enwiktionary'
			];
			if (localCheckuser.indexOf(mw.config.get('wgDBname')) !== -1) {
				work_area.append({
					type: 'div',
					label: 'The checkuser on this wiki should be locally handled, are you sure you want to request stewards\' help?',
					style: 'color: red; font-weight: bold;'
				});
			}

			// header mixed preview
			work_area.append({
				type: 'input',
				name: 'header',
				label: 'Header: ',
				value: username + '@' + TwinkleGlobal.arv.getProject()[0],
				size: 70
			});
			work_area.append({
				type: 'input',
				name: 'langcode',
				label: 'Language code: ',
				value: TwinkleGlobal.arv.getProject()[1]
			});
			work_area.append({
				type: 'input',
				name: 'project',
				label: 'Project shortcut: ',
				value: TwinkleGlobal.arv.getProject()[2]
			});
			work_area.append(
				{
					type: 'dyninput',
					name: 'sockpuppet',
					label: 'Users to compare',
					sublabel: 'Username :',
					tooltip: 'Usernames of suspected sockpuppets. Without the User:-prefix.',
					min: 2,
					max: 10
				});
			work_area.append({
				type: 'input',
				name: 'discussion',
				label: 'Discussion: ',
				tooltip: 'Local confirmation or policy',
				size: 65
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Reason',
				tooltip: 'will add --~~~~'
			});
			work_area.append({
				type: 'header',
				label: 'Due to the impact of checkuser, please confirm you really want to request this checkuser and click the box below.'
			});
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'I confirm this request is beneficial for the community and I will take full responsibility for this request.',
						name: 'disclaimer',
						value: 'disclaimer'
					}
				]
			});
			work_area = work_area.render();
			$('input:text[name=sockpuppet]', work_area).first().val(username);
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}
};

TwinkleGlobal.arv.callback.changeHidename = function(e) {
	var checked = e.target.checked;
	var form = e.target.form;
	var username = mw.config.get('wgRelevantUserName');

	if (checked) {
		form.header.value = '';
	} else {
		form.header.value = '[[User:' + username + '|' + username + ']]';
	}
};

TwinkleGlobal.arv.callback.evaluate = function(e) {
	var form = e.target;
	var header, summary, reason, comment, types, statusIndicator, metaapi;
	var uid = form.uid.value;
	switch (form.category.value) {
		case 'gsr':
			reason = '';
			comment = '';
			if (form.reason) {
				comment = form.reason.value;
			}

			types = form.getChecked('gsrtype');
			if (!types.length && comment === '') {
				alert('You must specify some reason');
				return;
			}

			reason = '* Please block ';
			if (MorebitsGlobal.interwikiPrefix !== null) {
				reason += '{{LockHide|1=' + uid + '|2=' + MorebitsGlobal.interwikiPrefix + ':}}';
			} else {
				reason += 'https:' + mw.config.get('wgServer') + mw.util.getUrl('Special:Contributions/' + uid);
			}
			reason += ': ';

			types = types.map(function(v) {
				switch (v) {
					default:
						return v;
				}
			}).join('. ');

			if (types) {
				reason += types;
			}
			if (comment !== '') {
				comment = comment.replace(/\r?\n/g, '\n:');  // indent newlines
				reason += (types ? '. ' : '') + comment;
			}
			reason = reason.trim();
			if (reason.search(/[.?!;]$/) === -1) {
				reason += '.';
			}
			reason += ' --~~~~';

			MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
			MorebitsGlobal.status.init(form);

			statusIndicator = new MorebitsGlobal.status('Reporting to Global sysops/Requests', 'Fetching page...');

			metaapi = TwinkleGlobal.getPref('metaApi');
			metaapi.edit('Global sysops/Requests', function(revision) {
				var text = revision.content.trim();

				text += '\n' + reason;

				return {
					text: text,
					summary: 'Reporting user' + TwinkleGlobal.getPref('summaryAd'),
					assert: 'user'
				};
			}).then(function() {
				statusIndicator.info('Done');
			}, function(e) {
				statusIndicator.error(e);
			});
			break;

		case 'srcu':
			var trust = form.disclaimer.checked;
			if (!trust) {
				alert('You should check the box after reading the text or you can not request');
				return;
			}
			var headerVal = form.header.value.trim();
			reason = form.reason.value.trim();
			var sockpuppets = $.map($('input:text[name=sockpuppet]', form), function (o) {
				return $(o).val() || null;
			});

			if (sockpuppets.length <= 1) {
				alert('You must specify at least two usernames to compare');
				return;
			}
			if (reason === '') {
				alert('You must provide the reason to run this check');
				return;
			}
			// build section title
			header = '=== ' + headerVal + ' ===\n';
			header += '{{CU request\n' +
				' |status          = \n' +
				' |language code   = ' + form.langcode.value + '\n' +
				' |project shortcut = ' + form.project.value + '\n';

			sockpuppets.forEach(function(v, i) {
				header += ' |user name' + (i + 1) + '      = ' + v + '\n';
			});

			header += ' |discussion      = ' + form.discussion.value + '\n' +
				' |reason          = ' + reason + ' --~~~~\n' +
				'}}';

			summary = 'Requesting checkuser for ' + headerVal;

			MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
			MorebitsGlobal.status.init(form);

			statusIndicator = new MorebitsGlobal.status('Reporting to Steward requests/Checkuser', 'Fetching page...');

			metaapi = TwinkleGlobal.getPref('metaApi');
			metaapi.edit('Steward requests/Checkuser', function(revision) {
				var text = revision.content;

				text = text.replace(/(== See also == <!-- DO NOT EDIT UNDER THIS LINE -->)/, header + '\n\n$1');
				return {
					text: text,
					summary: summary + TwinkleGlobal.getPref('summaryAd'),
					assert: 'user'
				};
			}).then(function() {
				statusIndicator.info('Done. Remember to review your edits.');
			}, function(e) {
				statusIndicator.error(e);
			});
			break;

		case 'global':
		/* falls through */
		default:
			reason = '';
			comment = '';
			if (form.reason) {
				comment = form.reason.value;
			}

			types = form.getChecked('globaltype');
			if (!types.length && comment === '') {
				alert('You must specify some reason');
				return;
			}

			var usernames = $.map($('input:text[name=username]', form), function(o) {
				return $(o).val() || null;
			});

			if (!usernames.length) {
				alert('You must specify at least one ' + mw.util.isIPAddress(uid) ? 'IP' : 'user');
				return;
			}

			if (mw.util.isIPAddress(uid)) {
				header = '=== Global block ';
				if (form.header.value.trim()) {
					header += 'for ' + form.header.value.trim();
				}
				header += ' ===\n';
				header += '{{Status}}\n';
				usernames.forEach(function(v) {
					header += '* {{Luxotool|' + v + '}}\n';
				});
				summary = 'Reporting [[Special:Contributions/' + uid + '|' + uid + ']]';
				if (usernames.length > 1) {
					summary += ' and ' + (usernames.length - 1) + ' other IP';
					if (usernames.length > 2) {
						summary += 's';
					}
				}
			} else {
				header = '=== Global lock ';
				if (form.header.value.trim()) {
					header += 'for ' + form.header.value.trim();
				}
				header += ' ===\n';
				if (form.hidename && form.hidename.checked) {
					summary = 'Reporting ' + (usernames.length > 1 ? usernames.length + ' accounts' : 'an account');
				} else {
					summary = 'Reporting [[Special:CentralAuth/' + uid + '|' + uid + ']]';
					if (usernames.length > 1) {
						summary += ' and ' + (usernames.length - 1) + ' other account';
						if (usernames.length > 2) {
							summary += 's';
						}
					}
				}
				header += '{{Status}}\n';
				if (usernames.length === 1) {
					header += '*{{LockHide|' + uid;
					if (form.hidename && form.hidename.checked) {
						header += '|hidename=1';
					}
					header += '}}\n';
				} else {
					if (usernames.length > TwinkleGlobal.getPref('srgCollapseNumber')) {
						header += '{{Collapse top|User list}}\n';
					}
					header += '*{{MultiLock|';
					header += usernames.join('|');
					if (form.hidename && form.hidename.checked) {
						header += '|hidename=1';
					}
					header += '}}\n';
					if (usernames.length > TwinkleGlobal.getPref('srgCollapseNumber')) {
						header += '{{Collapse bottom}}\n';
					}
				}
			}

			types = types.map(function(v) {
				switch (v) {
					default:
						return v;
				}
			}).join('. ');

			reason += ':';
			if (types) {
				reason += types;
			}
			if (comment !== '') {
				comment = comment.replace(/\r?\n/g, '\n:');  // indent newlines
				reason += (types ? '. ' : '') + comment;
			}
			reason = reason.trim();
			if (reason.search(/[.?!;]$/) === -1) {
				reason += '.';
			}
			reason += ' --~~~~';

			MorebitsGlobal.simpleWindow.setButtonsEnabled(false);
			MorebitsGlobal.status.init(form);

			statusIndicator = new MorebitsGlobal.status('Reporting to Steward requests/Global', 'Fetching page...');

			metaapi = TwinkleGlobal.getPref('metaApi');
			metaapi.edit('Steward requests/Global', function(revision) {
				var text = revision.content;
				if (new RegExp('{{\\s*([Ll]uxotool|[Ll]ock[Hh]ide|[Ll][Hh]|[Mm]ulti[Ll]ock).*?\\|\\s*(\\d+\\s*=\\s*)?' + RegExp.escape(uid, true) + '\\s*(\\||}})').test(text)) {
					statusIndicator.error('Report already present, will not add a new one');
					var $srgLink = '<a target="_blank" href="/wiki/m:SRG">m:SRG</a>';
					MorebitsGlobal.status.printUserText(header + reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $srgLink + ':');
					return $.Deferred().reject('dup');
				}
				if (mw.util.isIPAddress(uid)) {
					text = text.replace(/\n+(== Requests for global \(un\)lock and \(un\)hiding == *\n)/, '\n\n' + header + reason + '\n\n$1');
				} else {
					text = text.replace(/\n+(== See also == *\n)/, '\n\n' + header + reason + '\n\n$1');
				}
				return {
					text: text,
					summary: summary + TwinkleGlobal.getPref('summaryAd'),
					assert: 'user'
				};
			}).then(function() {
				statusIndicator.info('Done');
			}, function(e) {
				if (e === 'dup') {
					// pass
				} else {
					statusIndicator.error(e);
				}
			});
			break;
	}
};

})(jQuery);


// </nowiki>
