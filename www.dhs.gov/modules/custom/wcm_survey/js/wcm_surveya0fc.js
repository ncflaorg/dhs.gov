/**
 * @file
 *
 * javascript to cause a popup to appear to invite the user to take a survey
 */

var wcmSurveyPopupProcessed = false;
var wcmSurveyBypassSurvey = false;
var wcmSurveyPlacedInFooter = false;

(function ($) {

    /**
     * Log to the console.
     */
    function log(variable, label) {
        if (typeof drupalSettings.wcmSurvey === 'undefined' ||
            typeof drupalSettings.wcmSurvey.debugMode === 'undefined' ||
            !drupalSettings.wcmSurvey.debugMode) {
            return;
        }
        if (typeof console !== 'undefined' &&
            typeof console.log !== 'undefined') {
            if (typeof label !== 'undefined') {
                console.log(label + ' =>');
            }
            console.log(variable);
        }
        return;
    }

    /**
     * place the survey markup in the footer
     */
    function wcmSurveyPlaceInFooter() {
        if (wcmSurveyPlacedInFooter) {
            // this only needs to be done once
            return;
        }
        // put the survey text in the footer, but hidden
        $('body').append("<a style='position: fixed; top: 0px;' id='wcm-survey-target-id'></a>" + drupalSettings.wcmSurvey.surveyPopup);

        wcmSurveyPlacedInFooter = true;
        return;
    }

    /**
     * determine if a survey invite needs to be popped up and pop it up if necessary
     */
    function wcmSurveyProcess() {
        log('place in footer');
        wcmSurveyPlaceInFooter();
        $.cookie.raw = true;
        var ua = window.navigator.userAgent; // + added by Stephen Mustgrave
        var msie = ua.indexOf("MSIE"); // + added by Stephen Mustgrave
        if (wcmSurveyPopupProcessed) {
            // the survey has already been processed for this page load
            return false;
        } else {
            // prevent the survey from being processed multiple times per page load
            wcmSurveyPopupProcessed = true;
            log('wcmSurveyPopupProcessed = true;');
        }
        if (
            //The following lines were edited by Stephen Mustgrave
            window.navigator.userAgent !== 'undefined' && // + first checks that the userAgent variable is not undefined
            window.navigator.userAgent.indexOf("MSIE") > 0 && // + //if not undefined then get the MSIE index of the userAgent, and if greater than 0 the browser is Internet Explorer
            parseInt(ua.substring(msie + 5, ua.indexOf(".", msie))) <= 6) // + finally check that the version of internet explorer is greater then 6
            //.browser method was deprecated in jQuery 1.3 and removed in 1.9, when this module was enabled it was
            //throwing a TypeError: Cannot read property 'msie' of undefined
            /*    typeof $.browser.msie !== 'undefined' &&
                $.browser.msie &&
                parseInt($.browser.version) <= 6
              )*/
        {
            // log($.browser.version, 'Wrong IE version'); browser method is deprecated therefore didn't log the version number
            // we are in Internet Explorer <= 6 which is not currently supported
            log(parseInt(ua.substring(msie + 5, ua.indexOf(".", msie))), 'Wrong IE version');
            return false;
        }

        if (typeof drupalSettings.wcmSurvey !== 'undefined') {
            var wcmSurvey = drupalSettings.wcmSurvey;

            // Check to see if we're forcing the survey.
            var showSurvey = false;
            if (!drupalSettings.wcmSurvey.force) {
                // check to see if the cookie has been set to not show the survey again
                if ($.cookie('wcmSurveyBlockSurvey') &&
                    typeof wcmSurvey.surveyRetakeTimeout !== 'undefined' &&
                    wcmSurvey.surveyRetakeTimeout > 0) {
                    log('wcmSurveyBlockSurvey exists, so surveys are blocked');
                    return false;
                }

                // check to make sure we aren't on the front page
                log(window.location.pathname, 'window.location.pathname');
                if (window.location.pathname !== '/') {
                    // we are not on the front page
                    log('we are not on the front page');

                    // check to see if they have gone the necessary page depth
                    var pageDepth = $.cookie('wcmSurveyPageDepthC', Number, {path: '/'});

                    if (pageDepth === null || isNaN(pageDepth)) {
                        log('pageDepth is empty, so creating it');
                        pageDepth = 0;
                    }

                    // add the current page to the page depth object
                    pageDepth++;

                    log(pageDepth, 'pageDepth');
                    if (pageDepth >= wcmSurvey.pageDepth) {
                        log('User has reached the pageDepth thresh hold of ' + wcmSurvey.pageDepth);
                        // they have reached the necessary page depth for the survey to trigger

                        // check to see if they win the survey to be shown to them
                        // var randNumber = Math.floor((Math.random() * 100) + 1);
                        var randNumber = Math.random();
                        log(randNumber, 'randNumber');
                        log(wcmSurvey.userPercentage, 'wcmSurvey.userPercentage');

                        // Scale the target by the distance from the trigger, to get diminishing likelihood
                        var twoN = Math.pow(2, pageDepth - wcmSurvey.pageDepth); // 2^(n-1)
                        var x = wcmSurvey.userPercentage / 100.0;
                        var targetPercentage = x / (2.0 * (twoN + x * (1.0 - twoN)));
                        // var targetPercentage = wcmSurvey.userPercentage == 100 ? 100 : wcmSurvey.userPercentage / Math.pow(2, pageDepth - wcmSurvey.pageDepth + 1);
                        log(targetPercentage, 'targetPercentage');

                        if (x == 1 || randNumber <= targetPercentage) {
                            log('the random number fit within the percentage defined by the admin so show the survey');
                            // the random number fit within the percentage defined by the admin
                            showSurvey = true;
                        }
                        // set the cookie to NOT show the survey again for
                        // wcmSurvey.surveyRetakeTimeout days
                        // Disabled if wcmSurvey.surveyRetakeTimout == 0
                        if (showSurvey && wcmSurvey.surveyRetakeTimeout > 0) {
                            var surveyRetakeTimeout = new Date();
                            surveyRetakeTimeout.setDate(surveyRetakeTimeout.getDate() + wcmSurvey.surveyRetakeTimeout);
                            $.cookie('wcmSurveyBlockSurvey', true, {expires: surveyRetakeTimeout, path: '/'});
                        }
                    } else {
                        // they don't get the survey this time... so we will restart the page
                        // depth count
                        // pageDepth = 0;
                    }
                }

                var expireDate1 = new Date();
                expireDate1.setDate(expireDate1.getDate() + 1);
                $.cookie('wcmSurveyPageDepthC', pageDepth, {expires: expireDate1, path: '/'});
            } else {
                showSurvey = true;
            }

            if (showSurvey) {
              let element = $('#wcm-survey-popup');
              let settings = {
                dialogClass: "no-close",
                closeText: "hide",
                height: drupalSettings.wcmSurvey.height ? drupalSettings.wcmSurvey.height.replace('px', '') : 300,
                width: drupalSettings.wcmSurvey.width ? drupalSettings.wcmSurvey.width : 500,
                maxWidth: drupalSettings.wcmSurvey.maxWidth,
                buttons: [
                  {
                    text: drupalSettings.wcmSurvey.survey.yeslabel,
                    click: function() {
                      window.open(drupalSettings.wcmSurvey.survey.url, '_blank');
                      $( this ).dialog( "close" );
                    }
                  },
                  {
                    text: drupalSettings.wcmSurvey.survey.nolabel,
                    click: function() {
                      $( this ).dialog( "close" );
                    }
                  },
                ]
              };
              log(settings, 'settings');
              let myDialog  = Drupal.dialog(element, settings);
              myDialog.showModal();

              Drupal.attachBehaviors();
              return true;
            }
        }
        return false;
    }

    Drupal.behaviors.wcmSurvey = {
        attach: function (context) {
            wcmSurveyPlaceInFooter();
            log(drupalSettings.wcmSurvey);
            if (typeof drupalSettings.wcmSurvey !== 'undefined' &&
                typeof drupalSettings.wcmSurvey.pageDepth !== 'undefined' &&
                parseInt(drupalSettings.wcmSurvey.pageDepth) > 0) {
                // we are not waiting until the user exists the site
                log('wcmSurveyProcess(); line 211');
                wcmSurveyProcess();
            }


            // for links that are on the same domain don't popup survey
            $('a:not(.survey-processed)')
                .addClass('survey-processed')
                .click(function () {
                    var a = document.createElement('a');
                    a.href = $(this).attr('href');
                    if (a.hostname == window.location.hostname) {
                        // the user is staying on site and the survey can be bypassed
                        wcmSurveyBypassSurvey = true;
                    }
                });

            // for forms don't popup a survey
            $('form:not(.survey-processed)')
                .addClass('survey-processed')
                .submit(function () {
                    var a = document.createElement('a');
                    a.href = $(this).attr('action');
                    if (a.hostname == window.location.hostname) {
                        // the user is staying on site and the survey can be bypassed
                        wcmSurveyBypassSurvey = true;
                    }
                });
        }
    }

    $(document).ready(function () {
        wcmSurveyPlaceInFooter();
        if (typeof drupalSettings.wcmSurvey !== 'undefined' &&
            typeof drupalSettings.wcmSurvey.pageDepth !== 'undefined' &&
            parseInt(drupalSettings.wcmSurvey.pageDepth) == 0) {
            var pagesLoaded = wcmSurveyPagesLoadedAdd();

            $(window).bind('beforeunload', function (e) {
                var pagesLoaded = wcmSurveyPagesLoadedSubtract();

                if (!wcmSurveyBypassSurvey &&
                    pagesLoaded < 1 &&
                    wcmSurveyProcess()
                ) {
                    // all the other pages are closed
                    return '>>>>>' + Drupal.t('Before You Go') + '<<<<<\n\n' + $(drupalSettings.wcmSurvey.survey.body).text() + '\n\n' + Drupal.t('Please stick around and take our survey.');
                }
                // don't stop the page from closing
                return null
            });
        }
    });

    /**
     * Add another page to the wcmSurveyPagesLoaded cookie
     */
    function wcmSurveyPagesLoadedAdd() {
        var pagesLoaded = $.cookie('wcmSurveyPagesLoaded');
        if (typeof pagesLoaded === 'undefined') {
            var expireDate1 = new Date();
            expireDate1.setDate(expireDate1.getDate() + 1);
            pagesLoaded = 1;
        } else {
            pagesLoaded = parseInt(pagesLoaded) + 1;
        }
        $.cookie('wcmSurveyPagesLoaded', pagesLoaded, {expires: expireDate1, path: '/'});
        return pagesLoaded;
    }

    /**
     * remove a page from the wcmSurveyPagesLoaded cookie
     */
    function wcmSurveyPagesLoadedSubtract() {
        var pagesLoaded = $.cookie('wcmSurveyPagesLoaded');
        if (typeof pagesLoaded === 'undefined') {
            var expireDate1 = new Date();
            expireDate1.setDate(expireDate1.getDate() + 1);

        } else {
            pagesLoaded = pagesLoaded - 1;
        }
        $.cookie('wcmSurveyPagesLoaded', pagesLoaded, {expires: expireDate1, path: '/'});
        return pagesLoaded;
    }

})(jQuery);

/**
 * figure out the size of an object as if it were an associative array
 */
function object_size(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            size++;
        }
    }
    return size;
}

/**
 * sanitize a sting so it can be used as an object property key
 */
function sanitize_path(str) {
    var args = {
        '/': '--',
        '.': '-'
    };
    for (var key in args) {
        str = str.replace(key, args[key]);
    }
    return str;
}

/**
 * provide the indexOf function which is a built in property in Ie 9 and later for IE 8
 */
function indexOf(string, array) {
    for (var i in array) {
        if (array[i] === string) {
            return i;
        }
    }
    return false;
}

/**
 * Add String.trim() functionality if it doesn't exist
 *
 * @see http://stackoverflow.com/questions/2308134/trim-in-javascript-not-working-in-ie
 */
if (typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g, '');
    }
}
