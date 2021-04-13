// ==UserScript==
// @name         Steam: AStats game info
// @description  Add time to beat info and players rating form AStats.nl to Steam store pages.
// @author       Xeloses
// @version      1.0.1
// @license      GPL-3.0 (https://www.gnu.org/licenses/gpl-3.0.html)
// @namespace    Xeloses.Steam.AStats
// @match        https://store.steampowered.com/app/*
// @updateURL    https://raw.githubusercontent.com/Xeloses/steam-astats-info/master/steam-astats-info.user.js
// @downloadURL  https://raw.githubusercontent.com/Xeloses/steam-astats-info/master/steam-astats-info.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlhttpRequest
// @connect      astats.astats.nl
// @noframes
// @run-at       document-end
// ==/UserScript==

(function(){
    'use strict';

    /* globals $J */

    // check jQuery:
    if(typeof $J !== 'function') return;

    /*
     * @const AStats game info URL
     */
    const ASTATS_URL = 'https://astats.astats.nl/astats/Steam_Game_Info.php?AppID=';

    /*
     * @class Log
     */
    class XelLog{constructor(){let d=GM_info.script;this.author=d.author;this.app=d.name;this.ns=d.namespace;this.version=d.version;this.h='color:#c5c;font-weight:bold;';this.t='color:#ddd;font-weight:normal;';}log(s){console.log('%c['+this.app+']%c '+s,this.h,this.t)}info(s){console.info('%c['+this.app+']%c '+s,this.h,this.t+'font-style:italic;')}warn(s){console.warn('%c['+this.app+']%c '+s,this.h,this.t)}error(s){console.error('%c['+this.app+']%c '+s,this.h,this.t)}dump(v){console.log(v)}}
    const $log = new XelLog();

    function renderGameInfo(data,game_id){
        if(data.rating || data.achievements || data.time_to_beat.storyline || data.time_to_beat.fullgame || data.time_to_beat.complete){
            // HTML with game info:
            let astatsData = '<div><div class="block responsive_apppage_details_right heading"><a rel="noopener noreferrer" target="_blank" title="View more information on AStats.nl" href="' + ASTATS_URL+game_id + '">AStats</a> game info</div></div><div class="block responsive_apppage_details_left game_details"><div class="block_content"><div class="block_content_inner"><div class="details_block">'+(data.rating?'<div class="dev_row"><b>Players rating:</b> ' + data.rating + '</div>':'')+'<div class="dev_row"><b>Achievements:</b> ' + (data.achievements?data.achievements:'-') + '</div>'+(data.time_to_beat.storyline?'<div class="dev_row"><b>Storyline playthgough:</b> ' + data.time_to_beat.storyline + ' h.</div>':'')+(data.time_to_beat.fullgame?'<div class="dev_row"><b>Storyline &amp; Side quests:</b> ' + data.time_to_beat.fullgame + ' h.</div>':'')+(data.time_to_beat.complete?'<div class="dev_row"><b>Completionist:</b> ' + data.time_to_beat.complete + ' h.</div>':'')+'</div></div></div></div>';

            // insert game info into page:
            $J('.page_content>.rightcol.game_meta_data').prepend($J(astatsData));
        }
    }

    function extractGameInfo(data)
    {
        // parse HTML string to DOM:
        data = $J(data);

        // prepare empty result object:
        let result = {
            time_to_beat:{
                storyline:0,
                fullgame:0,
                complete:0
            },
            achievements:0,
            rating:0
        };

        // select game stats:
        let stats = data.find('.panel-gameinfo td.GameInfoBoxRow');
        if(stats && stats.length)
        {
            // clear stats data (remove unnecessary text):
            stats.find('span,br').remove();

            // extract stats values:
            stats.each(function(i)
            {
                switch(i)
                {
                    case 1: result.achievements = $J(this).text().trim();break;
                    case 2: result.time_to_beat.complete = $J(this).text().trim();break;
                    case 3: result.time_to_beat.storyline = $J(this).text().trim();break;
                    case 8: result.time_to_beat.fullgame = $J(this).text().trim();break;
                }
            });

            // get game rating:
            result.rating = parseFloat(data.find('.AStatsScore').text().trim())*10;

            return result;
        }

        return null;
    }

    function fetchGameInfo(game_id)
    {
        // get proper xmlHTTPrequest:
        let $xhr = (typeof GM.xmlhttpRequest !== 'undefined') ? GM.xmlhttpRequest : GM_xmlhttpRequest;
        // query info about game:
        $xhr({
            method:'GET',
            url: ASTATS_URL + game_id,
            onload:function(response)
            {
                // check responce status:
                if(response.status && response.status == 200)
                {
                    // check responce data:
                    if(response.response && response.response.length)
                    {
                        // parse data:
                        let data = extractGameInfo(response.response);
                        // check filtered data:
                        if(data)
                        {
                            // add game info to page:
                            renderGameInfo(data,game_id);
                        }
                        else
                        {
                            $log.info('Game does not have entry on AStats.');
                        }
                    }
                    else
                    {
                        $log.error('no data recieved from AStats.');
                    }
                }
                else
                {
                    $log.error((response.status?'['+response.status+']':'') + ' could not retrieve data from AStats.');
                }
            },
            onerror:function(response)
            {
                $log.error('network error.');
            },
        });
    }

    // check URL:
    if(/^https:\/\/store\.steampowered\.com\/app\/[\d]{2,}[\/]?[\S]*/i.test(window.location.href))
    {
        // get App ID:
        let appID = window.location.href.match(/\/app\/([\d]*)\//i).pop();

        fetchGameInfo(appID);

        $log.info('App Loaded.');
    }
})();
