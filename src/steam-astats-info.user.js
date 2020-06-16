// ==UserScript==
// @name         Steam AStats game info
// @description  Add time to beat info and players rating form AStats.nl to Steam store pages.
// @author       Xeloses
// @version      1.0
// @license      MIT
// @namespace    Xeloses.Steam.AStats
// @match        https://store.steampowered.com/app/*
// @updateURL    https://github.com/Xeloses/steam-astats-info/raw/master/steam-astats-info.user.js
// @downloadURL  https://github.com/Xeloses/steam-astats-info/raw/master/steam-astats-info.user.js
// @grant        GM_xmlhttpRequest
// @grant        GM.xmlhttpRequest
// @connect      astats.astats.nl
// @noframes
// @run-at       document-end
// ==/UserScript==

(function(){
    'use strict';

    // AStats game info URL:
    const ASTATS_URL = 'https://astats.astats.nl/astats/Steam_Game_Info.php?AppID=';

    // Enable/disable status & error output to console:
    const ENABLE_CONSOLE_OUTPUT = true;

    // Console message types:
    const LOG_INFO = 1;
    const LOG_WARN = 2;
    const LOG_ERROR = 3;

    // prevent script execution in <frame>s:
    if(window.self!=window.top){
        return;
    }

    function $log(msg,level=null){
        if(!ENABLE_CONSOLE_OUTPUT||!msg){return;}

        let t = '%c[Xeloses` AStats plugin]%c '+msg,
            hStyle = 'color:#c5c;font-weight:bold;',
            tStyle = 'color:#ddd;font-weight:normal;';

        switch(level){
            case LOG_INFO:
                console.info(t,hStyle,tStyle+'font-style:italic;');break;
            case LOG_WARN:
                console.warn(t,hStyle,tStyle);break;
            case LOG_ERROR:
                console.error(t,hStyle,tStyle);break;
            default:
                console.log(t,hStyle,tStyle);break;
        }
    }

    function renderGameInfo(data,game_id){
        if(data.rating || data.achievements || data.time_to_beat.storyline || data.time_to_beat.fullgame || data.time_to_beat.complete){
            // HTML with game info:
            let astatsData = '<div><div class="block responsive_apppage_details_right heading"><a rel="noopener noreferrer" target="_blank" title="View more information on AStats.nl" href="' + ASTATS_URL+game_id + '">AStats</a> game info</div></div><div class="block responsive_apppage_details_left game_details"><div class="block_content"><div class="block_content_inner"><div class="details_block">'+(data.rating?'<div class="dev_row"><b>Players rating:</b> ' + data.rating + '</div>':'')+'<div class="dev_row"><b>Achievements:</b> ' + (data.achievements?data.achievements:'-') + '</div>'+(data.time_to_beat.storyline?'<div class="dev_row"><b>Storyline playthgough:</b> ' + data.time_to_beat.storyline + ' h.</div>':'')+(data.time_to_beat.fullgame?'<div class="dev_row"><b>Storyline &amp; Side quests:</b> ' + data.time_to_beat.fullgame + ' h.</div>':'')+(data.time_to_beat.complete?'<div class="dev_row"><b>Completionist:</b> ' + data.time_to_beat.complete + ' h.</div>':'')+'</div></div></div></div>';

            // insert game info into page:
            $J('.page_content>.rightcol.game_meta_data').prepend($J(astatsData));
        }
    }

    function extractGameInfo(data){
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
        if(stats && stats.length){
            // clear stats data (remove unnecessary text):
            stats.find('span,br').remove();

            // extract stats values:
            stats.each(function(i){
                switch(i){
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

    function fetchGameInfo(game_id){
        // get proper xmlHTTPrequest:
        let $xhr = (typeof GM.xmlhttpRequest !== 'undefined')?GM.xmlhttpRequest:GM_xmlhttpRequest;
        // query info about game:
        $xhr({
            method:'GET',
            url: ASTATS_URL+game_id,
            headers:{
                //
            },
            onload:function(response){
                // check responce status:
                if(response.status && response.status == 200){
                    // check responce data:
                    if(response.response && response.response.length){
                        // parse data:
                        let data = extractGameInfo(response.response);
                        // check filtered data:
                        if(data){
                            $log('Data Loaded.',LOG_INFO);
                            // add game info to page:
                            renderGameInfo(data,game_id);
                        }else{
                            $log('Game does not have entry on AStats.',LOG_WARN);
                        }
                    }else{
                        $log('Error: no data recieved from AStats.',LOG_ERROR);
                    }
                }else{
                    $log('Error' + (response.status?'('+response.status+')':'') + ': could not retrieve data from AStats.',LOG_ERROR);
                }
            },
            onerror:function(response){
                $log('Error: request error.',LOG_ERROR);
            },
        });
    }

    // check URL:
    if (/https:\/\/store\.steampowered\.com\/app\/[\d]{2,}[\/]?[\S]*/i.test(window.location.href)) {

        // check Steam's jQuery object:
        if(typeof $J != 'function'){
            return;
        }

        // get App ID:
        let appID = window.location.href.match(/\/app\/([\d]*)\//i).pop();

        fetchGameInfo(appID);
    }
})();
