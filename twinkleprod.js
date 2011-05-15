/*
 ****************************************
 *** twinkleprod.js: PROD module
 ****************************************
 * Mode of invocation:     Tab ("PROD")
 * Active on:              Existing articles
 * Config directives in:   TwinkleConfig
 */

Twinkle.prod = function twinkleprod() {
	if( wgNamespaceNumber !== 0 || !wgCurRevisionId ) {
		return;
	}
	if (twinkleUserAuthorized) {
		twAddPortletLink( "javascript:Twinkle.prod.callback()", "PROD", "tw-prod", "Propose deletion via WP:PROD", "");
	} else {
		twAddPortletLink( 'javascript:alert("Your account is too new to use Twinkle.");', 'PROD', 'tw-prod', 'Propose deletion via WP:PROD', '');
	}
}

Twinkle.prod.callback = function twinkleprodCallback() {
	var Window = new SimpleWindow( 800, 410 );
	Window.setTitle( "Proposed deletion (PROD)" );
	Window.setScriptName( "Twinkle" );
	Window.addFooterLink( "Proposed deletion policy", "WP:PROD" );
	Window.addFooterLink( "BLP PROD policy", "WP:BLPPROD" );
	Window.addFooterLink( "Twinkle help", "WP:TW/DOC#prod" );

	var form = new QuickForm( Twinkle.prod.callback.evaluate );
	
	var field = form.append( {
			type: 'field',
			label: 'PROD type'
		} );
	field.append( {
			type: 'radio',
			name: 'prodtype',
			event: Twinkle.prod.callback.prodtypechanged,
			list: [
				{
					label: 'PROD (proposed deletion)',
					value: 'prod',
					checked: true,
					tooltip: 'Normal proposed deletion, per [[WP:PROD]]'
				},
				{
					label: 'BLP PROD (proposed deletion of unsourced BLPs)',
					value: 'prodblp',
					tooltip: 'Proposed deletion of new, completely unsourced biographies of living persons, per [[WP:BLPPROD]]'
				}
			]
		} );

	form.append( {
			type: 'field',
			label:'Work area',
			name: 'work_area'
		} );

	form.append( { type:'submit', label:'Propose deletion' } );	

	var result = form.render();
	Window.setContent( result );
	Window.display();
	
	// fake a change event on the first prod type radio, to initialize the type-dependent controls
	var evt = document.createEvent( "Event" );
	evt.initEvent( 'change', true, true );
	result.prodtype[0].dispatchEvent( evt );
}

Twinkle.prod.callback.prodtypechanged = function(event) {
  //prepare frame for prod type dependant controls
	var field = new QuickForm.element( {
			type: 'field',
			label: 'Parameters',
			name: 'work_area'
		} );
	// create prod type dependant controls
	switch( event.target.values )
	{
		case 'prod':
			field.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Notify page creator if possible',
							value: 'notify',
							name: 'notify',
							tooltip: "A notification template will be placed on the creator's talk page if this is true.",
							checked: true
						}
					]
				}
			);
			field.append( {
					type: 'textarea',
					name: 'reason',
					label: 'Reason for proposed deletion:',
					value: TwinkleConfig.prodReasonDefault,
				} );
			break;

		case 'prodblp':
		  // first, remember the prod value that the user entered in the textarea, in case he wants to switch back. We can abuse the config field for that.
		  if (event.target.form.reason) TwinkleConfig.prodReasonDefault = event.target.form.reason.value;
		
			field.append( {
					type: 'checkbox',
					list: [
						{
							label: 'Notify page creator if possible',
							value: 'notify',
							name: 'notify',
							tooltip: 'Creator of article has to be notified.',
							checked: true,
							disabled: true
						}
					]
				}
			);
			//temp warning, can be removed down the line once BLPPROD is more established. Amalthea, May 2010.
			var boldtext = document.createElement('b');
			boldtext.appendChild(document.createTextNode('Please note that only unsourced biographies of living persons are eligible for this tag, narrowly construed.'));
			field.append({
				type: 'div',
				label: boldtext,
			});
			if (wgArticleId < 26596183)
			{
				field.append({
					type: 'header',
					label:'It appears that this article was created before March 18, 2010, and is thus ineligible for a BLP PROD. Please make sure that this is not the case, or use normal PROD instead.',
				});
			}
			break;
			
		default: break;
	};

	event.target.form.replaceChild( field.render(), $(event.target.form).find('fieldset[name="work_area"]')[0] );
}


Twinkle.prod.callbacks = {
	main: function(pageobj) {
		var statelem = pageobj.getStatusElement();

		if( !pageobj.exists() ) {
			statelem.error( "It seems that the page doesn't exist.  Perhaps it has already been deleted." );
			return;
		}
		
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		var tag_re = /(\{\{(?:db-?|delete|[aitcmrs]fd|md1)[^{}]*?\|?[^{}]*?\}\})/i;
		if( tag_re.test( text ) ) {
			statelem.warn( 'Page already tagged with a deletion template, aborting procedure' );
			return;
		}

		// Remove tags that become superfluous with this action
		text = text.replace(/{\{\s*(New unreviewed article|Userspace draft)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/ig, "");

		var prod_re = /\{\{\s*(?:dated prod|dated prod blp|Prod blp\/dated|Proposed deletion\/dated)\s*\|(?:\{\{[^\{\}]*\}\}|[^\}\{])*\}\}/i;
		if( !prod_re.test( text ) ) {
			// Notification to first contributor
			if( params.usertalk ) {
				var thispage = new Wikipedia.page(wgPageName);
				thispage.setCallbackParameters(params);
				thispage.lookupCreator(Twinkle.prod.callbacks.userNotification);
			}
			// If not notifying, log this PROD
			else if( TwinkleConfig.logProdPages ) {
				Twinkle.prod.callbacks.addToLog(params, null);
			}

			var summaryText = "Proposing article for deletion per [[WP:" + (params.blp ? "BLP" : "") + "PROD]].";
			text = "\{\{subst:prod" + (params.blp ? " blp" : ("|1=" + params.reason)) + "\}\}\n" + text;
		}
		else {  // already tagged for PROD, so try endorsing it
			var prod2_re = /\{\{(?:Proposed deletion endorsed|prod-?2).*?\}\}/;
			if( prod2_re.test( text ) ) {
				statelem.warn( 'Page already tagged with \{\{prod\}\} and \{\{prod-2\}\} templates, aborting procedure' );
				return;
			}
			var confirmtext = "A \{\{prod\}\} tag was already found on this article. \nWould you like to add a \{\{prod-2\}\} (PROD endorsement) tag with your explanation?";
			if (params.blp) {
				confirmtext = "A non-BLP \{\{prod\}\} tag was found on this article.  \nWould you like to add a \{\{prod-2\}\} (PROD endorsement) tag with explanation \"unsourced BLP\"?";
			}
			if( !confirm( confirmtext ) ) {
				statelem.warn( 'Aborted per user request' );
				return;
			}

			var summaryText = "Endorsing proposed deletion per [[WP:" + (params.blp ? "BLP" : "") + "PROD]].";
			text = text.replace( prod_re, text.match( prod_re ) + "\n\{\{prod-2|1=" + (params.blp ? "article is a [[WP:BLPPROD|biography of a living person with no sources]]" : params.reason) + "\}\}\n" );

			if( TwinkleConfig.logProdPages ) {
				params.logEndorsing = true;
				Twinkle.prod.callbacks.addToLog(params);
			}
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summaryText + TwinkleConfig.summaryAd);
		pageobj.setWatchlist(TwinkleConfig.watchProdPages);
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},

	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();
		var usertalkpage = new Wikipedia.page('User talk:' + initialContrib, "Notifying initial contributor (" + initialContrib + ")");
		var notifytext = "\n\{\{subst:prodwarning" + (params.blp ? "BLP" : "") + "|1=" + wgPageName + "|concern=" + params.reason + "\}\} \~\~\~\~";
		usertalkpage.setAppendText(notifytext);
		usertalkpage.setEditSummary("Notification: proposed deletion of [[" + wgPageName + "]]." + TwinkleConfig.summaryAd);
		usertalkpage.setCreateOption('recreate');
		usertalkpage.setFollowRedirect(true);
		usertalkpage.append();
		if (TwinkleConfig.logProdPages) {
			params.logInitialContrib = initialContrib;
			Twinkle.prod.callbacks.addToLog(params);
		}
	},

	addToLog: function(params) {
		var wikipedia_page = new Wikipedia.page("User:" + wgUserName + "/" + TwinkleConfig.prodLogPageName, "Adding entry to userspace log");
		wikipedia_page.setCallbackParameters(params);
		wikipedia_page.load(Twinkle.prod.callbacks.saveLog);
	},

	saveLog: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// add blurb if log page doesn't exist
		if (!pageobj.exists()) {
			text =
				"This is a log of all [[WP:PROD|proposed deletion]] tags applied or endorsed by this user using [[WP:TW|Twinkle]]'s PROD module.\n\n" +
				"If you no longer wish to keep this log, you can turn it off using the [[Wikipedia:Twinkle/Preferences|preferences panel]], and " +
				"nominate this page for speedy deletion under [[WP:CSD#U1|CSD U1]].\n"
			;
		}

		// create monthly header
		var date = new Date();
		var headerRe = new RegExp("^==+\\s*" + date.getUTCMonthName() + "\\s+" + date.getUTCFullYear() + "\\s*==+", "m");
		if (!headerRe.exec(text)) {
			text += "\n\n=== " + date.getUTCMonthName() + " " + date.getUTCFullYear() + " ===";
		}

		var summarytext;
		if (params.logEndorsing) {
			text += "\n# [[" + wgPageName + "]]: endorsed " + (params.blp ? "BLP " : "") + "PROD. \~\~\~\~\~";
			if (params.reason != '' && params.reason != null) {
				text += "\n#* '''Reason''': " + params.reason + "\n";
			}
			summarytext = "Logging endorsement of PROD nomination of [[" + wgPageName + "]].";
		} else {
			text += "\n# [[" + wgPageName + "]]: " + (params.blp ? "BLP " : "") + "PROD";
			if (params.logInitialContrib) {
				text += "; notified \{\{user|" + params.logInitialContrib + "\}\}";
			}
			text += " \~\~\~\~\~\n#* '''Reason''': " + params.reason + "\n";
			summarytext = "Logging PROD nomination of [[" + wgPageName + "]].";
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summarytext + TwinkleConfig.summaryAd);
		pageobj.setCreateOption("recreate");
		pageobj.save();
	}
}

Twinkle.prod.callback.evaluate = function twinkleprodCallbackEvaluate(e) {
	wgPageName = wgPageName.replace( /_/g, ' ' ); // for queen/king/whatever and country!
	var form = e.target;

	var prodtypes = form.prodtype;
	for( var i = 0; i < prodtypes.length; i++ )
	{
		if( !prodtypes[i].checked ) continue;
		var prodtype = prodtypes[i].value;
		break;
	}

	var params = {
		usertalk: form.notify.checked,
		blp: prodtype=='prodblp',
		reason: prodtype=='prodblp' ? '' : form.reason.value  // using an empty string here as fallback will help with prod-2.
	};

	SimpleWindow.setButtonsEnabled( false );
	Status.init( form );

	if (prodtype == 'prodblp' && wgArticleId < 26596183)
	{
		if (!confirm( "It appears that this article was created before March 18, 2010, and is thus ineligible for a BLP PROD. Do you want to continue tagging it?" ))
		{
			Status.warn( 'Notice', 'Aborting per user input.' );
			return;
		}
	}

	Wikipedia.actionCompleted.redirect = wgPageName;
	Wikipedia.actionCompleted.notice = "Tagging complete";

	var wikipedia_page = new Wikipedia.page(wgPageName, "Tagging page");
	wikipedia_page.setFollowRedirect(true);  // for NPP, and also because redirects are ineligible for PROD
	wikipedia_page.setCallbackParameters(params);
	wikipedia_page.load(Twinkle.prod.callbacks.main);
}
