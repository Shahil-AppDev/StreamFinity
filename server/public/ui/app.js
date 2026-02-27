/**
 * StreamFinity — Full SPA (TikFinity-style)
 * All TikFinity pages + 18 widget overlays
 */
(function(){
'use strict';

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

// ═══════════════════════════════════════════
// NAV ITEMS — matches TikFinity's real pages
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// OVERLAY DEFINITIONS
// ═══════════════════════════════════════════
const OVERLAYS = [
    // ── PRO Overlays ──
    { id:'coinmatch',          title:'Coin Match',           pro:true,  desc:'Host live auctions where viewers bid with gifts to reach the top.', url:'/widget/coinmatch',          source:'streamfinity' },
    { id:'coinjar',            title:'Coin Jar',             pro:true,  desc:'Collect coins from viewers in a jar overlay with animated effects.', url:'/widget/coinjar',            source:'streamfinity' },
    { id:'wheelofactions',     title:'Wheel Of Actions',     pro:true,  desc:'Spin a wheel of custom actions — viewers trigger with gifts or commands.', url:'/widget/wheelofactions',     source:'streamfinity' },
    { id:'cannon',             title:'Gift Cannon',          pro:true,  desc:'Launch gift images across the screen with bouncy physics animations.', url:'/widget/cannon',             source:'streamfinity' },
    { id:'likefountain',       title:'Like Fountain',        pro:true,  desc:'Animated fountain of likes — the more likes, the bigger the fountain.', url:'/widget/likefountain',       source:'streamfinity' },
    // ── Free Overlays ──
    { id:'fallingsnow',        title:'Falling Snow',         pro:false, desc:'Simple falling snow animation overlay for your stream.', url:'/widget/fallingsnow',        source:'streamfinity' },
    { id:'socialmediarotator', title:'Social Media Rotator', pro:false, desc:'Rotate your social media links on stream with smooth animations.', url:'/widget/socialmediarotator', source:'streamfinity' },
    { id:'firework',           title:'Gift Firework',        pro:false, desc:'Celebratory firework animations triggered by gifts and milestones.', url:'/widget/firework',           source:'streamfinity' },
    { id:'emojify',            title:'Emojify',              pro:false, desc:'Display floating emojis on stream when viewers send emoji comments.', url:'/widget/emojify',            source:'streamfinity' },
    { id:'chat',               title:'Chat',                 pro:false, desc:'Display your live chat directly on stream with customizable themes.', url:'/widget/chat',               source:'streamfinity' },
    { id:'gifts',              title:'Gift Feed',            pro:false, desc:'Show gift notifications with animations when viewers send gifts.', url:'/widget/gifts',              source:'streamfinity' },
    { id:'transactionviewer',  title:'Points Animation',     pro:false, desc:'Animated points transaction overlay — show points earned in real-time.', url:'/widget/transactionviewer',  source:'streamfinity' },
    { id:'userinfo',           title:'User Info Screen',     pro:false, desc:'Display user info overlay — show viewer details on command.', url:'/widget/userinfo',           source:'streamfinity' },
    { id:'commandinfo',        title:'Command Info Screen',  pro:false, desc:'Show command results and info on stream via overlay.', url:'/widget/commandinfo',        source:'streamfinity' },
    { id:'myactions',          title:'My Actions',           pro:false, desc:'Custom action overlay — required for Actions & Events to work on stream.', url:'/widget/myactions',          source:'streamfinity' },
    { id:'carousel',           title:'Interaction Slider',   pro:false, desc:'Interactive slider overlay — viewers control the slider with gifts.', url:'/widget/carousel',           source:'streamfinity' },
    { id:'wheel',              title:'Wheel of Fortune',     pro:false, desc:'Interactive spin wheel game — viewers trigger spins with commands.', url:'/widget/wheel',              source:'streamfinity' },
    { id:'topgifter',          title:'Top Gifters',          pro:false, desc:'Display a live leaderboard of your top gifters during the stream.', url:'/widget/topgifter',          source:'streamfinity' },
    { id:'topliker',           title:'Top Likers',           pro:false, desc:'Show a leaderboard of your most active likers in real-time.', url:'/widget/topliker',           source:'streamfinity' },
    { id:'ranking',            title:'Ranking',              pro:false, desc:'Combined ranking overlay showing top viewers by engagement.', url:'/widget/ranking',            source:'streamfinity' },
    { id:'coindrop',           title:'Coin Drop',            pro:false, desc:'Drop coins on screen for viewers to collect with chat commands.', url:'/widget/coindrop',           source:'streamfinity' },
    { id:'timer',              title:'Timer',                pro:false, desc:'Countdown timer overlay — viewers can extend or shorten the timer.', url:'/widget/timer',              source:'streamfinity' },
    { id:'songrequests',       title:'Song Requests',        pro:true,  desc:'Display current song request from Spotify on your stream.', url:'/widget/songrequests',       source:'streamfinity' },
    { id:'viewercount',        title:'Viewer Count',         pro:false, desc:'Show your current viewer count as a clean overlay on stream.', url:'/widget/viewercount',        source:'streamfinity' },
    { id:'streambuddies',      title:'Stream Buddies',       pro:false, desc:'Animated buddy characters that react to stream events and gifts.', url:'/widget/streambuddies',      source:'streamfinity' },
    { id:'activity-feed',      title:'Activity Feed',        pro:false, desc:'Live activity feed showing all stream events — gifts, follows, shares.', url:'/widget/activity-feed',      source:'streamfinity' },
    { id:'webcamframe',        title:'Webcam Frame',         pro:true,  desc:'Decorative frames for your webcam — neon, glow, gradient, animated, corners, and more.', url:'/widget/webcamframe',        source:'streamfinity' },
    { id:'lastchatter',        title:'Last Chatter',         pro:false, desc:'Show the last person who chatted with their message, avatar and badges.', url:'/widget/lastchatter',        source:'streamfinity' },
    { id:'soundalert',         title:'Sound Alert',          pro:false, desc:'Play sound alerts on stream when viewers send gifts, follow, or share. Add to OBS for audio.', url:'/widget/soundalert',         source:'streamfinity' },
    { id:'tts',                title:'TTS Chat',             pro:false, desc:'Text-to-Speech overlay — reads chat messages and gift alerts aloud using Web Speech API.', url:'/widget/tts',                source:'streamfinity' },
];

// ═══════════════════════════════════════════
// SOUND ALERT DEFINITIONS
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// CHATBOT COMMANDS
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
let currentPage = 'start';
let ws = null;
let wsConnected = false;
let tiktokUsername = '';

// ═══════════════════════════════════════════
// i18n — TRANSLATIONS
// ═══════════════════════════════════════════
const SF_LANGS = {
en: {
_flag:'🇬🇧', _name:'English',
// ── common ──
'common.save':'Save','common.cancel':'Cancel','common.delete':'Delete','common.edit':'Edit','common.add':'Add','common.close':'Close','common.confirm':'Confirm','common.export':'Export','common.import':'Import','common.reset':'Reset','common.search':'Search...','common.loading':'Loading...','common.none':'None','common.enabled':'Enabled','common.disabled':'Disabled','common.yes':'Yes','common.no':'No','common.ok':'OK','common.error':'Error','common.success':'Success','common.actions':'Actions',
// ── nav ──
'nav.start':'Start','nav.setup':'Setup','nav.obsoverlays':'Overlays','nav.actionsandevents':'Actions & Events','nav.sounds':'Sounds','nav.tts':'TTS Chat','nav.chatcommands':'Chat Commands','nav.chatbot':'Chatbot','nav.user':'Points / User','nav.songrequests':'Song Requests','nav.likeathon':'Likeathon','nav.timer':'Timer','nav.wheel':'Wheel of Fortune','nav.coindrop':'Coin Drop','nav.challenge':'Challenge','nav.halving':'Halving','nav.dapi':'Developer API','nav.giftcatalog':'Gift Catalog','nav.transactions':'Transactions','nav.streamkey':'Stream Key','nav.livechannels':'Live Channels','nav.activitylog':'Activity Log','nav.overlays':'Overlay Gallery','nav.giftoverlays':'Gift Overlays','nav.lastx':'Last X Overlays','nav.graphicoverlays':'Graphic Overlays','nav.obsdocks':'OBS Docks','nav.giftbrowser':'Gift Browser','nav.goals':'Goals','nav.features':'Features','nav.admin':'Admin','nav.games_tools':'Games & Tools','nav.developer':'Developer','nav.crowdcontrol':'CrowdControl','nav.cchub':'CC Hub','nav.ccgames':'CC Games','nav.ccpolls':'CC Polls','nav.ccshop':'CC Shop','nav.ccleaderboard':'CC Leaderboard',
// ── topbar ──
'topbar.connect':'Connect','topbar.connected':'Connected','topbar.disconnect':'Disconnect','topbar.disconnected':'Disconnected','topbar.discord':'Discord','topbar.help':'Help',
// ── start ──
'start.welcome':'Welcome to StreamFinity','start.desc':'Your all-in-one TikTok LIVE streaming toolkit.','start.banner':'StreamFinity Pro','start.tiktok_live':'TikTok LIVE Connection','start.connect_btn':'Connect','start.disconnect_btn':'Disconnect','start.disconnected_toast':'Disconnected from TikTok','start.not_connected':'Not connected','start.offline':'Offline','start.viewers':'Viewers','start.current_viewers':'Current Viewers','start.likes':'Likes','start.total_likes':'Total Likes','start.live_feed':'Live Feed','start.live_feed_empty':'No events yet — connect to TikTok to see live activity.','start.quick_start':'Quick Start','start.qs1':'Connect your TikTok account','start.qs2':'Set up your overlays in OBS','start.qs3':'Configure actions & events','start.qs4':'Go live and enjoy!','start.plan':'Pro','start.all_features':'All features unlocked',
// ── setup ──
'setup.title':'Setup','setup.desc':'Configure your StreamFinity settings.','setup.connect_tiktok':'Connect TikTok','setup.points_system':'Points System','setup.subscriber_bonus':'Subscriber Bonus','setup.level_settings':'Level Settings','setup.obs_connection':'OBS Connection','setup.streamerbot':'Streamer.bot','setup.minecraft':'Minecraft','setup.reset_points':'Reset Points','setup.pro':'StreamFinity Pro','setup.patreon':'Patreon','setup.your_account':'Your Account','setup.import_export':'Import / Export','setup.advanced':'Advanced Settings','setup.debug':'Debug',
// ── setup.connect ──
'setup.connect.title':'TikTok Connection','setup.connect.desc':'Connect to a TikTok LIVE stream to receive events.','setup.connect.username':'TikTok Username','setup.connect.username_hint':'Enter without @','setup.connect.server_url':'Server URL','setup.connect.server_hint':'Default: auto-detect','setup.connect.auto_connect':'Auto-Connect on Start','setup.connect.auto_connect_desc':'Automatically connect when the app starts.','setup.connect.show_status':'Show Connection Status','setup.connect.show_status_desc':'Display connection status in the top bar.','setup.connect.desktop_notif':'Desktop Notifications','setup.connect.desktop_notif_desc':'Show desktop notifications for events.',
// ── setup.points ──
'setup.points.title':'Points System','setup.points.desc':'Configure how viewers earn points.','setup.points.enable':'Enable Points','setup.points.enable_desc':'Allow viewers to earn and spend points.','setup.points.name':'Points Name','setup.points.start_balance':'Starting Balance','setup.points.per_chat':'Points per Chat','setup.points.per_like':'Points per Like','setup.points.per_follow':'Points per Follow','setup.points.per_share':'Points per Share','setup.points.per_gift':'Points per Gift','setup.points.per_gift_hint':'Per diamond value','setup.points.per_min':'Points per Minute',
// ── setup.sub ──
'setup.sub.title':'Subscriber Bonus','setup.sub.desc':'Give subscribers extra perks.','setup.sub.enable':'Enable Subscriber Bonus','setup.sub.enable_desc':'Subscribers earn bonus points and perks.','setup.sub.multiplier':'Points Multiplier','setup.sub.multiplier_hint':'e.g. 2 = double points','setup.sub.badge':'Show Sub Badge','setup.sub.badge_desc':'Display a badge next to subscriber names.','setup.sub.priority_tts':'Priority TTS','setup.sub.priority_tts_desc':'Subscribers skip the TTS queue.','setup.sub.commands':'Exclusive Commands','setup.sub.commands_desc':'Allow subscriber-only chat commands.',
// ── setup.levels ──
'setup.levels.title':'Level Settings','setup.levels.desc':'Configure the leveling system.','setup.levels.enable':'Enable Levels','setup.levels.enable_desc':'Allow viewers to gain XP and level up.','setup.levels.xp_per_point':'XP per Point','setup.levels.xp_scale':'XP Scale Factor','setup.levels.xp_scale_hint':'Higher = slower leveling','setup.levels.level1_xp':'Level 1 XP','setup.levels.show_in_chat':'Show Level in Chat','setup.levels.show_in_chat_desc':'Display viewer level next to their name.','setup.levels.levelup_notif':'Level Up Notification','setup.levels.levelup_notif_desc':'Show a notification when a viewer levels up.',
// ── setup.obs ──
'setup.obs.title':'OBS WebSocket','setup.obs.desc':'Connect to OBS Studio via WebSocket for scene/source control.','setup.obs.status':'Status','setup.obs.not_connected':'Not connected','setup.obs.url':'WebSocket URL','setup.obs.password':'Password','setup.obs.connect':'Connect','setup.obs.reconnect':'Reconnect','setup.obs.disconnect':'Disconnect','setup.obs.scenes':'Scenes','setup.obs.scenes_empty':'Connect to OBS to see scenes.','setup.obs.sources':'Sources','setup.obs.sources_empty':'Connect to OBS to see sources.','setup.obs.controls':'Controls','setup.obs.start_stream':'Start Streaming','setup.obs.stop_stream':'Stop Streaming','setup.obs.start_rec':'Start Recording','setup.obs.stop_rec':'Stop Recording','setup.obs.auto_switch':'Auto Scene Switch','setup.obs.auto_switch_desc':'Automatically switch scenes on events.','setup.obs.start_scene':'Start Scene','setup.obs.end_scene':'End Scene',
// ── setup.sb ──
'setup.sb.title':'Streamer.bot','setup.sb.desc':'Connect to Streamer.bot for advanced automation.','setup.sb.enable':'Enable Streamer.bot','setup.sb.enable_desc':'Forward events to Streamer.bot via WebSocket.','setup.sb.url':'WebSocket URL','setup.sb.test':'Test Connection','setup.sb.messages':'Message Forwarding','setup.sb.forward_chat':'Forward Chat','setup.sb.forward_chat_desc':'Send chat messages to Streamer.bot.','setup.sb.forward_gifts':'Forward Gifts','setup.sb.forward_gifts_desc':'Send gift events to Streamer.bot.','setup.sb.forward_follows':'Forward Follows','setup.sb.forward_follows_desc':'Send follow events to Streamer.bot.',
// ── setup.mc ──
'setup.mc.title':'Minecraft RCON','setup.mc.desc':'Connect to a Minecraft server via RCON.','setup.mc.enable':'Enable Minecraft','setup.mc.enable_desc':'Send commands to Minecraft on events.','setup.mc.host':'Host','setup.mc.port':'Port','setup.mc.password':'RCON Password','setup.mc.test':'Test Connection','setup.mc.templates':'Command Templates','setup.mc.templates_desc':'Use {user}, {gift}, {amount} as placeholders.','setup.mc.on_gift':'On Gift','setup.mc.on_follow':'On Follow',
// ── setup.reset ──
'setup.reset.title':'Reset Points','setup.reset.desc':'Reset all viewer points and data.','setup.reset.danger':'Danger Zone','setup.reset.danger_desc':'This action cannot be undone.','setup.reset.btn':'Reset All Points','setup.reset.confirm':'Are you sure? This will reset ALL viewer points to 0.','setup.reset.done':'All points have been reset.',
// ── setup.pro ──
'setup.pro.title':'StreamFinity Pro','setup.pro.you_have':'You have','setup.pro.license':'Pro License','setup.pro.all_unlocked':'All features unlocked!','setup.pro.unlimited_overlays':'Unlimited Overlays','setup.pro.all_actions':'All Action Types','setup.pro.song_requests':'Song Requests','setup.pro.tts_chat':'TTS Chat',
// ── setup.patreon ──
'setup.patreon.title':'Patreon','setup.patreon.desc':'Connect your Patreon for supporter perks.','setup.patreon.enable':'Enable Patreon','setup.patreon.enable_desc':'Link Patreon supporters to TikTok viewers.','setup.patreon.connect':'Connect Patreon','setup.patreon.hint':'Requires Patreon OAuth setup.',
// ── setup.account ──
'setup.account.title':'Your Account','setup.account.active_profile':'Active Profile','setup.account.channel_id':'Channel ID','setup.account.screen_id':'Screen ID','setup.account.tiktok_username':'TikTok Username','setup.account.plan':'Plan','setup.account.appearance':'Appearance','setup.account.dark_mode':'Dark Mode','setup.account.dark_mode_desc':'Use dark theme for the interface.','setup.account.compact_sidebar':'Compact Sidebar','setup.account.compact_sidebar_desc':'Use a narrower sidebar with icons only.','setup.account.language':'Language','setup.account.tiktok_login':'TikTok Login','setup.account.tiktok_login_desc':'Sign in with your TikTok account for enhanced features.','setup.account.signin_tiktok':'Sign in with TikTok',
// ── setup.ie ──
'setup.ie.export_title':'Export Data','setup.ie.export_desc':'Download all your settings as a JSON file.','setup.ie.export_btn':'Export All Data','setup.ie.export_done':'Data exported successfully!','setup.ie.import_title':'Import Data','setup.ie.import_desc':'Upload a previously exported JSON file.','setup.ie.import_done':'Data imported successfully!','setup.ie.import_error':'Invalid import file.',
// ── setup.adv ──
'setup.adv.title':'Advanced Settings','setup.adv.enable_dapi':'Enable Developer API','setup.adv.enable_dapi_desc':'Allow external apps to access the API.','setup.adv.disable_antispam':'Disable Anti-Spam','setup.adv.disable_antispam_desc':'Turn off spam protection for events.','setup.adv.event_cooldown':'Event Cooldown (ms)','setup.adv.max_events':'Max Events/sec','setup.adv.log_events':'Log Events','setup.adv.log_events_desc':'Log all events to the console.','setup.adv.shortcuts':'Keyboard Shortcuts','setup.adv.api_connectivity':'API Connectivity',
// ── setup.debug ──
'setup.debug.title':'Debug','setup.debug.enable':'Enable Debug Mode','setup.debug.enable_desc':'Show detailed logs and debug info.','setup.debug.log_ws':'Log WebSocket','setup.debug.log_ws_desc':'Log all WebSocket messages.','setup.debug.event_sim':'Event Simulator','setup.debug.event_sim_desc':'Send fake events for testing.','setup.debug.system_info':'System Info','setup.debug.version':'Version','setup.debug.server':'Server','setup.debug.websocket':'WebSocket',
// ── obs events ──
'obs.connected':'Connected to OBS','obs.disconnected':'Disconnected from OBS','obs.stream_started':'Stream started','obs.stream_stopped':'Stream stopped','obs.rec_started':'Recording started','obs.rec_stopped':'Recording stopped','obs.scene_switched':'Scene switched',
// ── overlays ──
'overlays.title':'Overlay Gallery','overlays.desc':'Add overlays to your OBS scenes.','overlays.banner':'Drag overlay URLs into OBS as Browser Sources.','overlays.note':'Click an overlay to copy its URL.',
// ── obsdocks ──
'obsdocks.title':'OBS Docks','obsdocks.desc':'Add these as Custom Browser Docks in OBS.','obsdocks.note':'Go to OBS → Docks → Custom Browser Docks.',
// ── lastx ──
'lastx.title':'Last X Overlays','lastx.desc':'Show the last follower, gifter, liker, etc.','lastx.follower':'Last Follower','lastx.gifter':'Last Gifter','lastx.liker':'Last Liker','lastx.sharer':'Last Sharer','lastx.subscriber':'Last Subscriber','lastx.gift_counter':'Gift Counter','lastx.gift_counter_desc':'Show total gifts received.','lastx.note':'Add as Browser Source in OBS.',
// ── sounds ──
'sounds.title':'Sound Alerts','sounds.desc':'Play sounds when events happen.','sounds.enable':'Enable Sound Alerts','sounds.enable_desc':'Play sounds on stream events.','sounds.my_alerts':'My Sound Alerts','sounds.no_alerts':'No sound alerts configured yet.','sounds.add':'Add Sound Alert','sounds.add_alert':'Add Alert','sounds.edit_alert':'Edit Alert','sounds.sound_name':'Alert Name','sounds.trigger':'Trigger Event','sounds.trigger_hint':'Which event triggers this sound','sounds.sound_file':'Sound File','sounds.sound_file_hint':'MP3, WAV, OGG','sounds.choose_file':'Choose File','sounds.upload':'Upload Sound','sounds.upload_desc':'Upload custom sound files.','sounds.upload_failed':'Upload failed.','sounds.uploaded':'Sound uploaded!','sounds.volume':'Volume','sounds.test_sound':'Test','sounds.playing':'Playing...','sounds.added':'Sound alert added!','sounds.updated':'Sound alert updated!','sounds.deleted':'Sound alert deleted!','sounds.delete_confirm':'Delete this sound alert?','sounds.settings':'Settings','sounds.master_volume':'Master Volume','sounds.max_queue':'Max Queue Size','sounds.max_queue_desc':'Maximum sounds in queue.','sounds.play_simultaneously':'Play Simultaneously','sounds.play_simultaneously_desc':'Play multiple sounds at once.','sounds.library':'Sound Library','sounds.library_desc':'Browse built-in sounds.','sounds.note':'Add the Sound Alert widget to OBS for audio output.',
// ── tts ──
'tts.title':'TTS Chat','tts.desc':'Read chat messages aloud using text-to-speech.','tts.enable':'Enable TTS','tts.enable_desc':'Read chat messages aloud.','tts.general':'General Settings','tts.voice':'Voice','tts.speed':'Speed','tts.pitch':'Pitch','tts.volume':'Volume','tts.max_length':'Max Message Length','tts.who_can_use':'Who Can Use TTS','tts.all_viewers':'All Viewers','tts.followers_only':'Followers Only','tts.superfans_only':'Superfans Only','tts.team_only':'Team Only','tts.topgifters_only':'Top Gifters Only','tts.moderators_only':'Moderators Only','tts.comment_types':'Comment Types','tts.read_all':'Read All Messages','tts.read_all_desc':'Read every chat message.','tts.read_gifts':'Read Gift Messages','tts.read_gifts_desc':'Read gift notification messages.','tts.read_commands':'Read Commands','tts.read_commands_desc':'Read chat command responses.','tts.charge_points':'Charge Points','tts.charge_desc':'Charge viewers points to use TTS.','tts.points_per_msg':'Points per Message','tts.random_voice':'Random Voice','tts.random_voice_desc':'Use a random voice for each message.','tts.allowed_users':'Allowed Users','tts.allowed_desc':'Only these users can use TTS.','tts.allowlist':'Allowlist','tts.allowlist_only':'Allowlist Only','tts.special_users':'Special Users','tts.special_desc':'Users with custom TTS settings.','tts.add_special':'Add Special User','tts.voice_tester':'Voice Tester','tts.test_msg':'Test Message','tts.test_btn':'Test TTS','tts.test_desc':'Preview how TTS sounds.','tts.obs_url':'OBS Browser Source URL','tts.obs_url_desc':'Add this URL as a Browser Source in OBS for audio.','tts.note':'Add the TTS widget to OBS for audio output.',
// ── user / points ──
'user.title':'Points / User Database','user.desc':'Manage viewer points, levels, and data.','user.total_viewers':'Total Viewers','user.in_database':'in database','user.total_points':'Total Points','user.distributed':'distributed','user.avg_level':'Avg Level','user.across_all':'across all viewers','user.total_gifts':'Total Gifts','user.received':'received','user.viewer':'Viewer','user.points':'Points','user.level':'Level','user.gifts':'Gifts','user.last_seen':'Last Seen','user.search':'Search viewers...','user.sort_points':'Sort by Points','user.sort_level':'Sort by Level','user.sort_gifts':'Sort by Gifts','user.sort_name':'Sort by Name',
// ── songs ──
'songs.title':'Song Requests','songs.desc':'Let viewers request songs via Spotify.','songs.enable':'Enable Song Requests','songs.enable_desc':'Allow viewers to request songs.','songs.spotify_connection':'Spotify Connection','songs.spotify_status':'Spotify Status','songs.connect_spotify':'Connect Spotify','songs.now_playing':'Now Playing','songs.queue':'Queue','songs.queue_empty':'No songs in queue.','songs.commands':'Commands','songs.settings':'Settings','songs.allow_explicit':'Allow Explicit','songs.allow_explicit_desc':'Allow explicit songs.','songs.allow_skip':'Allow Skip','songs.allow_skip_desc':'Allow viewers to skip songs.','songs.max_queue':'Max Queue Size','songs.cost_play':'Cost to Play','songs.cost_skip':'Cost to Skip','songs.search_title':'Search Songs','songs.search_desc':'Search for songs on Spotify.','songs.search_btn':'Search','songs.song_name':'Song Name','songs.checking':'Checking...','songs.note':'Requires Spotify Premium.',
// ── spotify ──
'spotify.connect':'Connect Spotify','spotify.connected_as':'Connected as','spotify.not_connected':'Not connected to Spotify','spotify.disconnected':'Disconnected from Spotify','spotify.nothing_playing':'Nothing playing','spotify.paused':'Paused','spotify.resumed':'Resumed','spotify.skipped':'Skipped','spotify.added_to_queue':'Added to queue',
// ── likeathon ──
'likeathon.title':'Likeathon','likeathon.desc':'Set a like goal and reward your viewers!','likeathon.settings':'Settings','likeathon.enable':'Enable Likeathon','likeathon.enable_desc':'Track likes toward a goal.','likeathon.goal':'Like Goal','likeathon.reward':'Reward Message','likeathon.reward_placeholder':'We reached the goal! Thank you!','likeathon.progress':'Progress','likeathon.current':'Current Likes','likeathon.started':'Likeathon started!','likeathon.reset_done':'Likeathon reset.',
// ── timer ──
'timer.title':'Timer','timer.desc':'Countdown timer for your stream.','timer.settings':'Settings','timer.duration':'Duration (seconds)','timer.label':'Label','timer.label_placeholder':'Timer','timer.started':'Timer started!','timer.paused':'Timer paused.','timer.reset':'Timer reset.','timer.finished':'Timer finished!',
// ── wheel ──
'wheel.title':'Wheel of Fortune','wheel.desc':'Spin a wheel with custom segments.','wheel.segments':'Segments','wheel.segments_desc':'Add segments to the wheel.','wheel.no_segments':'No segments yet.','wheel.no_segments_desc':'Add at least 2 segments.','wheel.add':'Add Segment','wheel.edit':'Edit Segment','wheel.label':'Label','wheel.color':'Color','wheel.weight':'Weight','wheel.count':'segments','wheel.added':'Segment added!','wheel.updated':'Segment updated!','wheel.deleted':'Segment deleted!','wheel.delete_confirm':'Delete this segment?',
// ── profile ──
'profile.new':'New Profile','profile.new_stream':'New Stream Profile','profile.manage':'Manage Profiles','profile.name':'Profile Name','profile.placeholder':'My Stream','profile.tiktok_user':'TikTok Username','profile.no_tiktok':'No TikTok linked','profile.create':'Create Profile','profile.created':'Profile created!','profile.switched':'Switched to {name}','profile.delete_confirm':'Delete this profile? All its data will be lost.','profile.deleted':'Profile deleted.','profile.cannot_delete_last':'Cannot delete the last profile.',
},
fr: {
_flag:'🇫🇷', _name:'Français',
'nav.start':'Accueil','nav.setup':'Configuration','nav.obsoverlays':'Overlays','nav.actionsandevents':'Actions & Événements','nav.sounds':'Sons','nav.tts':'TTS Chat','nav.chatcommands':'Commandes Chat','nav.chatbot':'Chatbot','nav.user':'Points / Utilisateurs','nav.songrequests':'Demandes de Musique','nav.likeathon':'Likeathon','nav.timer':'Minuteur','nav.wheel':'Roue de la Fortune','nav.crowdcontrol':'CrowdControl','nav.cchub':'CC Hub','nav.ccgames':'CC Jeux','nav.ccpolls':'CC Sondages','nav.ccshop':'CC Boutique','nav.ccleaderboard':'CC Classement',
'topbar.connect':'Connecter','topbar.connected':'Connecté','topbar.disconnect':'Déconnecter','topbar.disconnected':'Déconnecté',
'start.welcome':'Bienvenue sur StreamFinity','start.desc':'Votre boîte à outils TikTok LIVE tout-en-un.','start.connect_btn':'Connecter','start.disconnect_btn':'Déconnecter','start.not_connected':'Non connecté','start.viewers':'Spectateurs','start.likes':'Likes','start.live_feed':'Flux en direct','start.live_feed_empty':'Aucun événement — connectez-vous à TikTok.',
'setup.title':'Configuration','setup.desc':'Configurez vos paramètres StreamFinity.',
'common.save':'Enregistrer','common.cancel':'Annuler','common.delete':'Supprimer','common.edit':'Modifier','common.add':'Ajouter','common.close':'Fermer','common.confirm':'Confirmer','common.export':'Exporter','common.import':'Importer','common.search':'Rechercher...',
},
de: {
_flag:'🇩🇪', _name:'Deutsch',
'nav.start':'Start','nav.setup':'Einstellungen','nav.obsoverlays':'Overlays','nav.actionsandevents':'Aktionen & Events','nav.sounds':'Sounds','nav.tts':'TTS Chat','nav.chatcommands':'Chat-Befehle','nav.chatbot':'Chatbot','nav.user':'Punkte / Benutzer','nav.songrequests':'Songwünsche','nav.likeathon':'Likeathon','nav.timer':'Timer','nav.wheel':'Glücksrad','nav.crowdcontrol':'CrowdControl','nav.cchub':'CC Hub','nav.ccgames':'CC Spiele','nav.ccpolls':'CC Umfragen','nav.ccshop':'CC Shop','nav.ccleaderboard':'CC Rangliste',
'topbar.connect':'Verbinden','topbar.connected':'Verbunden','topbar.disconnect':'Trennen','topbar.disconnected':'Getrennt',
'start.welcome':'Willkommen bei StreamFinity','start.desc':'Ihr All-in-One TikTok LIVE Streaming-Toolkit.','start.connect_btn':'Verbinden','start.disconnect_btn':'Trennen','start.not_connected':'Nicht verbunden','start.viewers':'Zuschauer','start.likes':'Likes','start.live_feed':'Live-Feed','start.live_feed_empty':'Keine Events — verbinden Sie sich mit TikTok.',
'setup.title':'Einstellungen','setup.desc':'Konfigurieren Sie Ihre StreamFinity-Einstellungen.',
'common.save':'Speichern','common.cancel':'Abbrechen','common.delete':'Löschen','common.edit':'Bearbeiten','common.add':'Hinzufügen','common.close':'Schließen','common.confirm':'Bestätigen','common.export':'Exportieren','common.import':'Importieren','common.search':'Suchen...',
},
es: {
_flag:'🇪🇸', _name:'Español',
'nav.start':'Inicio','nav.setup':'Configuración','nav.obsoverlays':'Overlays','nav.actionsandevents':'Acciones y Eventos','nav.sounds':'Sonidos','nav.tts':'TTS Chat','nav.chatcommands':'Comandos de Chat','nav.chatbot':'Chatbot','nav.user':'Puntos / Usuarios','nav.songrequests':'Peticiones de Canciones','nav.likeathon':'Likeathon','nav.timer':'Temporizador','nav.wheel':'Ruleta de la Fortuna','nav.crowdcontrol':'CrowdControl','nav.cchub':'CC Hub','nav.ccgames':'CC Juegos','nav.ccpolls':'CC Encuestas','nav.ccshop':'CC Tienda','nav.ccleaderboard':'CC Clasificación',
'topbar.connect':'Conectar','topbar.connected':'Conectado','topbar.disconnect':'Desconectar','topbar.disconnected':'Desconectado',
'start.welcome':'Bienvenido a StreamFinity','start.desc':'Tu kit de herramientas TikTok LIVE todo en uno.','start.connect_btn':'Conectar','start.disconnect_btn':'Desconectar','start.not_connected':'No conectado','start.viewers':'Espectadores','start.likes':'Likes','start.live_feed':'Feed en vivo','start.live_feed_empty':'Sin eventos — conéctate a TikTok.',
'setup.title':'Configuración','setup.desc':'Configura tus ajustes de StreamFinity.',
'common.save':'Guardar','common.cancel':'Cancelar','common.delete':'Eliminar','common.edit':'Editar','common.add':'Añadir','common.close':'Cerrar','common.confirm':'Confirmar','common.export':'Exportar','common.import':'Importar','common.search':'Buscar...',
}
};

function sfGetLang() { return _rawLoad('sf_lang', 'en'); }
function sfSetLang(lang) { _rawSave('sf_lang', lang); }
function t(key, params) {
    const lang = sfGetLang();
    let val = (SF_LANGS[lang] && SF_LANGS[lang][key]) || (SF_LANGS.en && SF_LANGS.en[key]) || key;
    if (params) Object.keys(params).forEach(function(k) { val = val.replace('{' + k + '}', params[k]); });
    return val;
}

// ═══════════════════════════════════════════
// WEBSOCKET CONNECTION
// ═══════════════════════════════════════════
function connectWS() {
    try {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        ws = new WebSocket(proto + '//' + location.host + '/ws');
        ws.onopen = () => { wsConnected = true; console.log('[SF] WS connected'); };
        ws.onclose = () => { wsConnected = false; console.log('[SF] WS disconnected'); setTimeout(connectWS, 5000); };
        ws.onerror = (e) => { console.warn('[SF] WS error', e); };
        ws.onmessage = (ev) => {
            try {
                const d = JSON.parse(ev.data);
                if (d.event && d.data) {
                    const e = d.event;
                    if (e.type === 'chat') addLiveEvent({ type:'chat', html:'<i class="fa-solid fa-message" style="color:var(--blue)"></i> <b>@'+(d.data.uniqueId||'?')+'</b>: '+(d.data.comment||'') });
                    else if (e.type === 'gift') addLiveEvent({ type:'gift', html:'<i class="fa-solid fa-gift" style="color:var(--red)"></i> <b>@'+(d.data.uniqueId||'?')+'</b> sent '+(d.data.giftName||'gift')+' x'+(d.data.repeatCount||1) });
                    else if (e.type === 'follow') addLiveEvent({ type:'follow', html:'<i class="fa-solid fa-user-plus" style="color:var(--green)"></i> <b>@'+(d.data.uniqueId||'?')+'</b> followed' });
                    else if (e.type === 'share') addLiveEvent({ type:'share', html:'<i class="fa-solid fa-share" style="color:var(--purple)"></i> <b>@'+(d.data.uniqueId||'?')+'</b> shared' });
                    else if (e.type === 'like') addLiveEvent({ type:'like', html:'<i class="fa-solid fa-heart" style="color:var(--pink)"></i> <b>@'+(d.data.uniqueId||'?')+'</b> liked' });
                }
            } catch(_) {}
        };
    } catch(e) { console.warn('[SF] WS init failed', e); }
}

// ═══════════════════════════════════════════
// OBS WEBSOCKET CLIENT (obs-websocket v5 protocol)
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// CROWDCONTROL MULTIPLAYER WS CLIENT
// ═══════════════════════════════════════════

// ═══════════════════════════════════════════
// PROFILE SYSTEM (multi-profile like TikFinity)
// Each profile = a "screen" with its own actions, sounds, commands, goals, overlays, settings
// Widget URLs use ?cid={channelId}&screen={screenId}
// ═══════════════════════════════════════════
function _rawLoad(key, def) { try { return JSON.parse(localStorage.getItem(key)) || def; } catch(_) { return def; } }
function _rawSave(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ── Profile Manager ──
function getProfiles() { return _rawLoad('sf_profiles', []); }
function saveProfiles(profiles) { _rawSave('sf_profiles', profiles); }
function getActiveProfileId() { return localStorage.getItem('sf_active_profile') || null; }
function setActiveProfileId(id) { localStorage.setItem('sf_active_profile', id); }

function getActiveProfile() {
    const profiles = getProfiles();
    const activeId = getActiveProfileId();
    return profiles.find(p => p.id === activeId) || profiles[0] || null;
}

function createProfile(name, tiktokUser) {
    const profiles = getProfiles();
    const id = 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 4);
    const channelId = Math.floor(1000000 + Math.random() * 9000000).toString();
    const profile = {
        id,
        name: name || 'Profile ' + (profiles.length + 1),
        channelId,
        tiktokUsername: tiktokUser || '',
        screenId: '1',
        createdAt: new Date().toISOString(),
        color: ['#8b5cf6','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899'][profiles.length % 6]
    };
    profiles.push(profile);
    saveProfiles(profiles);
    setActiveProfileId(id);
    if (_domReady) reloadProfileData();
    return profile;
}

function switchProfile(id) {
    const profiles = getProfiles();
    if (!profiles.find(p => p.id === id)) return false;
    setActiveProfileId(id);
    reloadProfileData();
    return true;
}


function deleteProfile(id) {
    let profiles = getProfiles();
    if (profiles.length <= 1) return false;
    profiles = profiles.filter(p => p.id !== id);
    saveProfiles(profiles);
    // Clean up profile data from localStorage
    const prefix = 'sf_' + id + '_';
    Object.keys(localStorage).filter(k => k.startsWith(prefix)).forEach(k => localStorage.removeItem(k));
    if (getActiveProfileId() === id) {
        setActiveProfileId(profiles[0].id);
        reloadProfileData();
    }
    return true;
}


// ── Profile-scoped Local Storage ──
function sfLoad(key, def) {
    const pid = getActiveProfileId();
    if (!pid) return def;
    return _rawLoad('sf_' + pid + '_' + key, def);
}
function sfSave(key, val) {
    const pid = getActiveProfileId();
    if (!pid) return;
    _rawSave('sf_' + pid + '_' + key, val);
}

// ── Global (non-profile) storage ──
function sfLoadGlobal(key, def) { return _rawLoad('sf_g_' + key, def); }
function sfSaveGlobal(key, val) { _rawSave('sf_g_' + key, val); }

// ── Initialize default profile if none exists ──
function ensureProfile() {
    let profiles = getProfiles();
    if (profiles.length === 0) {
        // Migrate existing data to first profile
        const p = createProfile('Default Profile', '');
        // Migrate old sf_ keys to new profile-scoped keys
        const oldKeys = ['actions','sounds','commands','goals','giftoverlays','graphics','wheel_segments','setup'];
        oldKeys.forEach(k => {
            const oldVal = localStorage.getItem('sf_' + k);
            if (oldVal) {
                localStorage.setItem('sf_' + p.id + '_' + k, oldVal);
                localStorage.removeItem('sf_' + k);
            }
        });
    }
    if (!getActiveProfileId() && profiles.length > 0) {
        setActiveProfileId(profiles[0].id);
    }
}

// ── Load profile-scoped data into global vars ──
let _domReady = false;
function reloadProfileData() {
    const profile = getActiveProfile();
    if (profile) tiktokUsername = profile.tiktokUsername || '';
    userActions = sfLoad('actions', []);
    userSounds = sfLoad('sounds', []);
    userCommands = sfLoad('commands', []);
    userGiftOverlays = sfLoad('giftoverlays', []);
    userGraphics = sfLoad('graphics', []);
    userWheelSegments = sfLoad('wheel_segments', [
        { label:'Prize 1', color:'#8b5cf6', weight:1 },
        { label:'Prize 2', color:'#3b82f6', weight:1 },
        { label:'Prize 3', color:'#10b981', weight:1 },
        { label:'Try Again', color:'#6b7280', weight:2 }
    ]);
    if (_domReady) updateProfileSelector();
}

// ── Profile Selector UI ──
function updateProfileSelector() {
    const el = document.getElementById('sfProfileSelector');
    if (!el) return;
    const profiles = getProfiles();
    const active = getActiveProfile();
    if (!active) return;
    el.innerHTML = `
        <div class="profile-current" id="sfProfileToggle">
            <div class="profile-dot" style="background:${active.color}"></div>
            <span class="profile-name">${active.name}</span>
            <i class="fa-solid fa-chevron-down" style="font-size:10px;margin-left:4px"></i>
        </div>
        <div class="profile-dropdown hidden" id="sfProfileDropdown">
            ${profiles.map(p => `
                <div class="profile-option${p.id===active.id?' active':''}" data-pid="${p.id}">
                    <div class="profile-dot" style="background:${p.color}"></div>
                    <div class="profile-option-info">
                        <div class="profile-option-name">${p.name}</div>
                        <div class="profile-option-user">${p.tiktokUsername ? '@'+p.tiktokUsername : t('profile.no_tiktok')}</div>
                    </div>
                    ${p.id===active.id?'<i class="fa-solid fa-check" style="color:var(--green);margin-left:auto"></i>':''}
                </div>
            `).join('')}
            <div class="profile-dropdown-sep"></div>
            <div class="profile-option profile-add-btn" id="sfAddProfile">
                <i class="fa-solid fa-plus" style="color:var(--accent)"></i>
                <span style="color:var(--accent)">${t('profile.new')}</span>
            </div>
            <div class="profile-option profile-manage-btn" id="sfManageProfiles">
                <i class="fa-solid fa-gear" style="color:var(--text-muted)"></i>
                <span style="color:var(--text-muted)">${t('profile.manage')}</span>
            </div>
        </div>`;
    // Bind toggle
    document.getElementById('sfProfileToggle').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('sfProfileDropdown').classList.toggle('hidden');
    });
    // Bind profile switch
    el.querySelectorAll('.profile-option[data-pid]').forEach(opt => {
        opt.addEventListener('click', () => {
            switchProfile(opt.dataset.pid);
            document.getElementById('sfProfileDropdown').classList.add('hidden');
            renderPage(currentPage);
            sfToast(t('profile.switched', { name: getActiveProfile().name }), 'info');
        });
    });
    // Bind add profile
    const addBtn = document.getElementById('sfAddProfile');
    if (addBtn) addBtn.addEventListener('click', () => {
        document.getElementById('sfProfileDropdown').classList.add('hidden');
        openNewProfileModal();
    });
    // Bind manage profiles
    const manageBtn = document.getElementById('sfManageProfiles');
    if (manageBtn) manageBtn.addEventListener('click', () => {
        document.getElementById('sfProfileDropdown').classList.add('hidden');
        openManageProfilesModal();
    });
    // Close dropdown on outside click
    document.addEventListener('click', () => {
        const dd = document.getElementById('sfProfileDropdown');
        if (dd) dd.classList.add('hidden');
    }, { once: true });
}

function openNewProfileModal() {
    const body = `
        <div class="form-group"><label>${t('profile.name')}</label><input class="form-input" id="npName" placeholder="${t('profile.placeholder')}" autofocus></div>
        <div class="form-group"><label>${t('profile.tiktok_user')}</label>
            <div class="input-with-icon"><i class="fa-solid fa-at"></i><input class="form-input" id="npTiktok" placeholder="your_username"></div>
        </div>`;
    sfModal(t('profile.new_stream'), body, () => {
        const name = document.getElementById('npName').value.trim() || 'Profile ' + (getProfiles().length + 1);
        const tiktok = document.getElementById('npTiktok').value.trim();
        const p = createProfile(name, tiktok);
        renderPage(currentPage);
        sfToast(t('profile.created', { name: p.name }), 'success');
    }, t('profile.create'));
}

function openManageProfilesModal() {
    const profiles = getProfiles();
    const activeId = getActiveProfileId();
    const rows = profiles.map(p => `
        <div class="manage-profile-row" style="display:flex;align-items:center;gap:12px;padding:10px;border-radius:8px;background:${p.id===activeId?'var(--accent-bg)':'var(--surface)'}">
            <div class="profile-dot" style="background:${p.color};width:12px;height:12px;border-radius:50%;flex-shrink:0"></div>
            <div style="flex:1">
                <div style="color:var(--white);font-weight:600;font-size:13px">${p.name}${p.id===activeId?' <span style="color:var(--green);font-size:11px">(active)</span>':''}</div>
                <div style="color:var(--text-muted);font-size:11px">${p.tiktokUsername ? '@'+p.tiktokUsername : 'No TikTok'} &middot; Channel: ${p.channelId} &middot; Created: ${new Date(p.createdAt).toLocaleDateString()}</div>
            </div>
            ${profiles.length > 1 ? `<button class="btn btn-sm btn-danger sf-del-profile" data-pid="${p.id}" ${p.id===activeId?'title="Switch to another profile first"':''}><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>`).join('');
    sfModal('Manage Profiles', `<div style="display:flex;flex-direction:column;gap:8px">${rows}</div>`, null, null);
    setTimeout(() => {
        $$('.sf-del-profile').forEach(btn => btn.addEventListener('click', () => {
            const pid = btn.dataset.pid;
            const p = getProfiles().find(x => x.id === pid);
            if (!p) return;
            sfConfirm(t('profile.delete_confirm', {name: p.name}), () => {
                if (deleteProfile(pid)) {
                    sfToast(t('profile.deleted'), 'info');
                    renderPage(currentPage);
                    // Close modal
                    const modal = document.getElementById('sfModalOverlay');
                    if (modal) modal.classList.add('hidden');
                } else {
                    sfToast(t('profile.cannot_delete_last'), 'error');
                }
            });
        }));
    }, 100);
}

// ── Widget URL helper (includes cid + screen from active profile) ──
// screenOverride: pass 1-8 to target a specific overlay screen (for multi-screen support)
function widgetUrl(widgetId, extraParams, screenOverride) {
    const profile = getActiveProfile();
    const cid = profile ? profile.channelId : '0';
    const screen = screenOverride || (profile ? profile.screenId : '1');
    let url = location.origin + '/widget/' + widgetId + '?cid=' + cid + '&screen=' + screen;
    if (extraParams) url += '&' + extraParams;
    return url;
}

// ── Init profiles on load ──
ensureProfile();

let userActions = sfLoad('actions', []);
let userSounds = sfLoad('sounds', []);
let userCommands = sfLoad('commands', []);
let userGiftOverlays = sfLoad('giftoverlays', []);
let userGraphics = sfLoad('graphics', []);
let userWheelSegments = sfLoad('wheel_segments', [
    { label:'Prize 1', color:'#8b5cf6', weight:1 },
    { label:'Prize 2', color:'#3b82f6', weight:1 },
    { label:'Prize 3', color:'#10b981', weight:1 },
    { label:'Try Again', color:'#6b7280', weight:2 }
]);

// ── Timer / Challenge / Halving State ──
let timerState = { running: false, paused: false, total: 300, remaining: 300, interval: null, label: '' };
let challengeState = { running: false, target: 100, current: 0, name: '', reward: '', timeLimit: 600, remaining: 600, interval: null };
let halvingState = { running: false, startValue: 1000, value: 1000, halvings: 0 };

// ── Overlay Presets (like TikFinity) ──
const OVERLAY_PRESETS = {
    chat: [
        { name:'Default Dark', fontSize:14, animation:'fadeIn', bgColor:'#1a1a24', textColor:'#f1f1f5' },
        { name:'Neon Glow', fontSize:16, animation:'slideUp', bgColor:'#0d0d1a', textColor:'#00ff88' },
        { name:'Minimal Light', fontSize:13, animation:'fadeIn', bgColor:'#ffffff', textColor:'#1a1a2e' },
        { name:'Bubble Chat', fontSize:15, animation:'bounceIn', bgColor:'#2d1b69', textColor:'#e8d5ff' }
    ],
    gifts: [
        { name:'Classic Alert', fontSize:18, animation:'bounceIn', bgColor:'#1a1a24', textColor:'#f5c842' },
        { name:'Epic Entrance', fontSize:22, animation:'explosion', bgColor:'#0d0d1a', textColor:'#ff4500' },
        { name:'Minimal Toast', fontSize:14, animation:'slideDown', bgColor:'#ffffff', textColor:'#1a1a2e' },
        { name:'Full Screen', fontSize:28, animation:'zoom', bgColor:'#000000', textColor:'#ffffff' }
    ],
    topgifter: [
        { name:'Leaderboard Classic', fontSize:14, animation:'fadeIn', bgColor:'#1a1a24', textColor:'#f5c842' },
        { name:'Podium Style', fontSize:16, animation:'slideUp', bgColor:'#0d0d1a', textColor:'#ff6b6b' }
    ],
    viewercount: [
        { name:'Simple Counter', fontSize:20, animation:'fadeIn', bgColor:'transparent', textColor:'#ffffff' },
        { name:'Animated Pulse', fontSize:24, animation:'pulse', bgColor:'#1a1a24', textColor:'#8b5cf6' }
    ],
    wheel: [
        { name:'Rainbow Wheel', fontSize:14, animation:'spin', bgColor:'transparent', textColor:'#ffffff' },
        { name:'Dark Neon', fontSize:14, animation:'spin', bgColor:'#0d0d1a', textColor:'#00ff88' }
    ],
    timer: [
        { name:'Countdown Dark', fontSize:32, animation:'fadeIn', bgColor:'#1a1a24', textColor:'#e74c5a' },
        { name:'Minimal White', fontSize:28, animation:'fadeIn', bgColor:'transparent', textColor:'#ffffff' },
        { name:'Neon Timer', fontSize:36, animation:'pulse', bgColor:'#0d0d1a', textColor:'#00ff88' }
    ],
    firework: [
        { name:'Gold Burst', fontSize:14, animation:'explosion', bgColor:'transparent', textColor:'#f5c842' },
        { name:'Rainbow Party', fontSize:14, animation:'explosion', bgColor:'transparent', textColor:'#ff4500' }
    ],
    emojify: [
        { name:'Floating Emojis', fontSize:32, animation:'float', bgColor:'transparent', textColor:'#ffffff' },
        { name:'Emoji Rain', fontSize:28, animation:'rain', bgColor:'transparent', textColor:'#ffffff' }
    ]
};

// ── Reusable Modal System ──
function sfModal(title, bodyHtml, onSave, saveLabel) {
    const existing = document.getElementById('sfDynModal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'sfDynModal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box" style="text-align:left;width:480px">
        <div class="modal-close" id="sfModalClose"><i class="fa-solid fa-xmark"></i></div>
        <div class="modal-header"><h3>${title}</h3></div>
        <div class="modal-body">${bodyHtml}</div>
        <div class="modal-footer">
            <button class="btn" id="sfModalCancel">${t('common.cancel')}</button>
            <button class="btn-primary" id="sfModalSave">${saveLabel || t('common.save')}</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#sfModalClose').addEventListener('click', close);
    overlay.querySelector('#sfModalCancel').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#sfModalSave').addEventListener('click', () => { if (onSave) onSave(); close(); });
    return overlay;
}

function sfConfirm(msg, onYes) {
    const existing = document.getElementById('sfDynModal');
    if (existing) existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'sfDynModal';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box" style="width:380px">
        <div class="modal-icon"><i class="fa-solid fa-triangle-exclamation" style="color:var(--yellow)"></i></div>
        <h2>${t('common.are_you_sure')}</h2>
        <p>${msg}</p>
        <div class="modal-footer" style="justify-content:center">
            <button class="btn" id="sfConfNo">${t('common.cancel')}</button>
            <button class="btn btn-danger" id="sfConfYes">${t('common.confirm')}</button>
        </div>
    </div>`;
    document.body.appendChild(overlay);
    const close = () => overlay.remove();
    overlay.querySelector('#sfConfNo').addEventListener('click', close);
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#sfConfYes').addEventListener('click', () => { if (onYes) onYes(); close(); });
}

var _sfNotifs = [];
var _sfNotifUnread = 0;
function sfToast(msg, type) {
    const t = document.createElement('div');
    t.className = 'sf-toast sf-toast-' + (type || 'info');
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.add('sf-toast-show'));
    setTimeout(() => { t.classList.remove('sf-toast-show'); setTimeout(() => t.remove(), 400); }, 3000);
    // Store in notification history
    _sfNotifs.unshift({ msg, type: type || 'info', time: Date.now() });
    if (_sfNotifs.length > 50) _sfNotifs.pop();
    _sfNotifUnread++;
    _sfUpdateNotifBadge();
}
function _sfUpdateNotifBadge() {
    const badge = document.querySelector('.notif-badge');
    if (!badge) return;
    if (_sfNotifUnread > 0) { badge.textContent = _sfNotifUnread > 9 ? '9+' : _sfNotifUnread; badge.classList.remove('hidden'); }
    else badge.classList.add('hidden');
}

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
function init() {
    try {
        _domReady = true;
        // Apply saved theme & accent
        const savedTheme = sfLoadGlobal('theme', 'dark');
        if (savedTheme !== 'dark') document.documentElement.setAttribute('data-theme', savedTheme);
        const savedAccent = sfLoadGlobal('accentColor', '');
        if (savedAccent) document.documentElement.style.setProperty('--accent', savedAccent);
        const savedCompact = sfLoadGlobal('compactSidebar', false);
        console.log('[SF] init: renderSidebar'); renderSidebar();
        if (savedCompact) document.getElementById('sidebar')?.classList.add('compact');
        console.log('[SF] init: bindTopBar'); bindTopBar();
        console.log('[SF] init: langSelector'); initLangSelector();
        console.log('[SF] init: bindModals'); bindModals();
        console.log('[SF] init: bindSearch'); bindSearch();
        console.log('[SF] init: profileSelector'); updateProfileSelector();
        console.log('[SF] init: connectWS'); connectWS();
        const hash = location.hash.replace('#','') || 'start';
        console.log('[SF] init: navigateTo', hash); navigateTo(hash);
        console.log('[SF] init: done');
    } catch (err) {
        const msg = err instanceof Error ? (err.stack || err.message) : (typeof err === 'string' ? err : JSON.stringify(err, Object.getOwnPropertyNames(err || {})));
        console.error('[StreamFinity] init() crashed:', msg, err);
        const main = document.getElementById('mainContent');
        if (main) main.innerHTML = '<div style="padding:40px;color:#e74c5a"><h2>Init Error</h2><pre style="color:#fff;margin-top:12px;white-space:pre-wrap">' + msg + '</pre></div>';
    }
}

// ═══════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════
function buildNAV() {
    return [
        { section: 'main', items: [
            { id:'start',           label:t('nav.start'),           icon:'fa-solid fa-house' },
            { id:'setup',           label:t('nav.setup'),           icon:'fa-solid fa-gear' },
        ]},
        { section: t('nav.features'), items: [
            { id:'actionsandevents',label:t('nav.actionsandevents'),icon:'fa-solid fa-bolt' },
            { id:'sounds',          label:t('nav.sounds'),          icon:'fa-solid fa-volume-high' },
            { id:'tts',             label:t('nav.tts'),             icon:'fa-solid fa-microphone' },
            { id:'chatbot',         label:t('nav.chatbot'),         icon:'fa-solid fa-robot' },
            { id:'chatcommands',    label:t('nav.chatcommands'),    icon:'fa-solid fa-terminal' },
            { id:'songrequests',    label:t('nav.songrequests'),    icon:'fa-solid fa-music' },
            { id:'user',            label:t('nav.user'),            icon:'fa-solid fa-users' },
        ]},
        { section: t('nav.overlays'), items: [
            { id:'obsoverlays',     label:t('nav.obsoverlays'),     icon:'fa-solid fa-layer-group' },
            { id:'goals',           label:t('nav.goals'),           icon:'fa-solid fa-bullseye' },
            { id:'giftoverlays',    label:t('nav.giftoverlays'),    icon:'fa-solid fa-gift' },
            { id:'graphicoverlays', label:t('nav.graphicoverlays'), icon:'fa-solid fa-image' },
            { id:'lastx',           label:t('nav.lastx'),           icon:'fa-solid fa-clock-rotate-left' },
            { id:'obsdocks',        label:t('nav.obsdocks'),        icon:'fa-solid fa-table-columns' },
            { id:'giftbrowser',     label:t('nav.giftbrowser'),     icon:'fa-solid fa-magnifying-glass' },
            { id:'giftcatalog',     label:t('nav.giftcatalog'),     icon:'fa-solid fa-book' },
        ]},
        { section: t('nav.crowdcontrol'), items: [
            { id:'cchub',           label:t('nav.cchub'),           icon:'fa-solid fa-gamepad' },
            { id:'ccgames',         label:t('nav.ccgames'),         icon:'fa-solid fa-dice' },
            { id:'ccpolls',         label:t('nav.ccpolls'),         icon:'fa-solid fa-square-poll-vertical' },
            { id:'ccshop',          label:t('nav.ccshop'),          icon:'fa-solid fa-store' },
            { id:'ccleaderboard',   label:t('nav.ccleaderboard'),   icon:'fa-solid fa-ranking-star' },
        ]},
        { section: t('nav.games_tools'), items: [
            { id:'likeathon',       label:t('nav.likeathon'),       icon:'fa-solid fa-heart-pulse' },
            { id:'timer',           label:t('nav.timer'),           icon:'fa-solid fa-stopwatch' },
            { id:'wheel',           label:t('nav.wheel'),           icon:'fa-solid fa-circle-notch' },
            { id:'coindrop',        label:t('nav.coindrop'),        icon:'fa-solid fa-coins' },
            { id:'challenge',       label:t('nav.challenge'),       icon:'fa-solid fa-flag-checkered' },
            { id:'halving',         label:t('nav.halving'),         icon:'fa-solid fa-scissors' },
            { id:'streamkey',       label:t('nav.streamkey'),       icon:'fa-solid fa-key' },
            { id:'livechannels',   label:t('nav.livechannels'),   icon:'fa-solid fa-tower-broadcast' },
        ]},
        { section: t('nav.developer'), items: [
            { id:'activitylog',     label:t('nav.activitylog'),     icon:'fa-solid fa-list-timeline' },
            { id:'dapi',            label:t('nav.dapi'),            icon:'fa-solid fa-code' },
            { id:'transactions',    label:t('nav.transactions'),    icon:'fa-solid fa-receipt' },
        ]},
    ];
}
function renderSidebar() {
    const sb = $('#sidebar');
    const NAV = buildNAV();
    let html = '';
    NAV.forEach(group => {
        if (group.section !== 'main') {
            html += `<div class="nav-section-label">${group.section}</div>`;
        }
        html += '<div class="nav-section">';
        group.items.forEach(item => {
            const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
            const pro = item.pro ? '<span class="nav-pro">PRO</span>' : '';
            html += `<div class="nav-item" data-page="${item.id}"><i class="${item.icon}"></i><span>${item.label}</span>${badge}${pro}</div>`;
        });
        html += '</div>';
        if (group.section === 'main') html += '<div class="nav-sep"></div>';
    });
    html += `<div class="nav-bottom"><div class="nav-item" data-page="admin"><i class="fa-solid fa-chart-line"></i><span>${t('nav.admin')}</span></div></div>`;
    sb.innerHTML = html;

    sb.addEventListener('click', e => {
        const item = e.target.closest('.nav-item');
        if (!item) return;
        const page = item.dataset.page;
        if (page === 'admin') { window.open('/admin','_blank'); return; }
        navigateTo(page);
    });
}

function navigateTo(page) {
    currentPage = page;
    location.hash = page;
    $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === page));
    renderPage(page);
    $('#mainContent').scrollTop = 0;
    // Close mobile sidebar on navigation
    $('#sidebar')?.classList.remove('sidebar-open');
    $('#sidebarOverlay')?.classList.remove('active');
    document.body.classList.remove('sidebar-visible');
}

// ═══════════════════════════════════════════
// TOP BAR
// ═══════════════════════════════════════════
function bindTopBar() {
    $('#connectBtn').addEventListener('click', () => { $('#connectModal').classList.remove('hidden'); });
    $('#logoBtn').addEventListener('click', () => navigateTo('start'));
    const logoImg = $('#logoImg');
    if (logoImg) logoImg.addEventListener('error', () => { logoImg.classList.add('hidden'); $('#logoFallback').classList.remove('hidden'); });

    // Hamburger / mobile sidebar toggle
    const hamburger = $('#hamburgerBtn');
    const sidebar = $('#sidebar');
    const overlay = $('#sidebarOverlay');
    if (hamburger && sidebar) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('sidebar-open');
            overlay?.classList.toggle('active');
            document.body.classList.toggle('sidebar-visible');
        });
        overlay?.addEventListener('click', () => {
            sidebar.classList.remove('sidebar-open');
            overlay.classList.remove('active');
            document.body.classList.remove('sidebar-visible');
        });
    }

    // Notification dropdown
    $('#notifBell').addEventListener('click', e => {
        e.stopPropagation();
        const dd = $('#notifDropdown');
        dd.classList.toggle('hidden');
        $('#helpDropdown').classList.add('hidden');
        if (!dd.classList.contains('hidden')) _sfRenderNotifDropdown();
    });

    // Help dropdown
    $('#helpBtn').addEventListener('click', e => {
        e.stopPropagation();
        const dd = $('#helpDropdown');
        dd.classList.toggle('hidden');
        $('#notifDropdown').classList.add('hidden');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
        $('#notifDropdown').classList.add('hidden');
        $('#helpDropdown').classList.add('hidden');
        $('#sfLangDropdown')?.classList.add('hidden');
    });
    $$('.dropdown-panel').forEach(el => el.addEventListener('click', e => e.stopPropagation()));

    // Accordion
    $$('.accordion-title').forEach(el => {
        el.addEventListener('click', () => {
            const item = el.parentElement;
            const wasOpen = item.classList.contains('open');
            item.classList.toggle('open', !wasOpen);
            el.querySelector('i').className = wasOpen ? 'fa-regular fa-plus' : 'fa-regular fa-minus';
        });
    });

    // Dropdown tabs
    $$('.dropdown-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            tab.parentElement.querySelectorAll('.dropdown-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });
}

// ═══════════════════════════════════════════
// MODALS
// ═══════════════════════════════════════════
function bindModals() {
    // Connect modal
    $('#closeConnectModal').addEventListener('click', () => { $('#connectModal').classList.add('hidden'); });
    $('#connectModal').addEventListener('click', e => { if (e.target.id === 'connectModal') e.target.classList.add('hidden'); });

    $('#doConnectBtn').addEventListener('click', async () => {
        const user = $('#tiktokUsername').value.trim();
        if (!user) return;
        const btn = $('#doConnectBtn');
        const status = $('#connectStatus');
        btn.disabled = true;
        status.innerHTML = '<span style="color:var(--yellow)"><i class="fa-solid fa-spinner fa-spin"></i> Connecting to @' + user + '...</span>';
        try {
            const res = await fetch('/api/tiktok/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: user, profileId: getActiveProfileId() })
            });
            const data = await res.json();
            if (data.success) {
                tiktokUsername = user;
                updateProfileField('tiktokUsername', user);
                if (data.channelId) updateProfileField('channelId', data.channelId.toString());
                updateProfileSelector();
                status.innerHTML = '<span style="color:var(--green)"><i class="fa-solid fa-check"></i> ' + t('connect.connected', {user}) + '</span>';
                updateConnectionUI(true, user);
                sfToast(t('connect.connected', {user}), 'success');
                setTimeout(() => { $('#connectModal').classList.add('hidden'); }, 1200);
            } else {
                status.innerHTML = '<span style="color:var(--red,#e74c5a)"><i class="fa-solid fa-xmark"></i> ' + (data.error || t('connect.failed')) + '</span>';
                sfToast(t('connect.failed') + ': ' + (data.error || ''), 'error');
            }
        } catch (err) {
            status.innerHTML = '<span style="color:var(--red,#e74c5a)"><i class="fa-solid fa-xmark"></i> ' + t('connect.network_error') + '</span>';
            sfToast(t('connect.network_error') + ': ' + err.message, 'error');
        }
        btn.disabled = false;
    });
}

function updateConnectionUI(connected, username) {
    const cs = $('#connectionStatus');
    if (connected) {
        cs.innerHTML = `<span class="status-dot online"></span><span class="status-label">@${username}</span>`;
    } else {
        cs.innerHTML = `<span class="status-dot offline"></span><span class="status-label">${t('topbar.disconnected')}</span>`;
    }
}

// ═══════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════
function bindSearch() {
    document.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
        if (e.key === 'Escape') $('#searchModal').classList.add('hidden');
    });

    const SEARCH_EXTRAS = [
        { keywords: 'tiktok connect username live stream', label: t('setup.connect_tiktok'), icon: 'fa-solid fa-plug', page: 'setup' },
        { keywords: 'points coins currency earn spend', label: t('setup.points_system'), icon: 'fa-solid fa-coins', page: 'setup' },
        { keywords: 'obs websocket scene source recording', label: t('setup.obs_connection'), icon: 'fa-solid fa-video', page: 'setup' },
        { keywords: 'streamer.bot streamerbot automation', label: t('setup.streamerbot'), icon: 'fa-solid fa-robot', page: 'setup' },
        { keywords: 'minecraft rcon server command', label: t('setup.minecraft'), icon: 'fa-solid fa-cube', page: 'setup' },
        { keywords: 'subscriber bonus multiplier sub', label: t('setup.subscriber_bonus'), icon: 'fa-solid fa-star', page: 'setup' },
        { keywords: 'level xp experience progression', label: t('setup.level_settings'), icon: 'fa-solid fa-arrow-up-right-dots', page: 'setup' },
        { keywords: 'import export backup json settings', label: t('setup.import_export'), icon: 'fa-solid fa-file-export', page: 'setup' },
        { keywords: 'debug log websocket console', label: t('setup.debug'), icon: 'fa-solid fa-bug', page: 'setup' },
        { keywords: 'advanced api dapi cooldown antispam', label: t('setup.advanced'), icon: 'fa-solid fa-sliders', page: 'setup' },
        { keywords: 'patreon supporter patron', label: t('setup.patreon'), icon: 'fa-brands fa-patreon', page: 'setup' },
        { keywords: 'account profile language dark mode theme', label: t('setup.your_account'), icon: 'fa-solid fa-user', page: 'setup' },
        { keywords: 'reset points zero clear', label: t('setup.reset_points'), icon: 'fa-solid fa-trash', page: 'setup' },
        { keywords: 'pro license premium unlock', label: t('setup.pro'), icon: 'fa-solid fa-crown', page: 'setup' },
        { keywords: 'webhook http post request api', label: 'Webhook Effect', icon: 'fa-solid fa-globe', page: 'actionsandevents' },
        { keywords: 'voicemod voice changer effect', label: 'Voicemod Effect', icon: 'fa-solid fa-waveform-lines', page: 'actionsandevents' },
        { keywords: 'stream key rtmp srt generate', label: t('nav.streamkey'), icon: 'fa-solid fa-key', page: 'streamkey' },
        { keywords: 'webcam frame camera border overlay', label: 'Webcam Frames', icon: 'fa-solid fa-camera', page: 'obsoverlays' },
        { keywords: 'goal progress bar target objective', label: t('nav.goals'), icon: 'fa-solid fa-bullseye', page: 'goals' },
        { keywords: 'action timer interval recurring repeat', label: 'Action Timers', icon: 'fa-solid fa-clock', page: 'timer' },
        { keywords: 'spotify music song request play skip', label: t('nav.songrequests'), icon: 'fa-solid fa-music', page: 'songrequests' },
        { keywords: 'crowdcontrol game roulette dice slots trivia', label: t('nav.cchub'), icon: 'fa-solid fa-gamepad', page: 'cchub' },
    ];

    function doSearch(q) {
        const results = $('#searchResults');
        if (!q) { results.innerHTML = ''; return; }
        let matches = [];
        const seen = new Set();
        const addMatch = (m) => { const k = m.page + '|' + m.label; if (!seen.has(k)) { seen.add(k); matches.push(m); } };
        buildNAV().forEach(g => g.items.forEach(item => {
            if (item.label.toLowerCase().includes(q)) addMatch({ label: item.label, icon: item.icon, page: item.id });
        }));
        OVERLAYS.forEach(ov => {
            if (ov.title.toLowerCase().includes(q) || (ov.desc && ov.desc.toLowerCase().includes(q)))
                addMatch({ label: ov.title, icon: 'fa-solid fa-layer-group', page: 'obsoverlays' });
        });
        SEARCH_EXTRAS.forEach(ex => {
            if (ex.keywords.includes(q) || ex.label.toLowerCase().includes(q))
                addMatch({ label: ex.label, icon: ex.icon, page: ex.page });
        });
        results.innerHTML = matches.slice(0, 10).map((m, i) =>
            `<div class="search-result${i===0?' sr-active':''}" data-page="${m.page}" data-idx="${i}"><i class="${m.icon}"></i><span>${m.label}</span><span class="sr-section">${m.page}</span></div>`
        ).join('') || `<div class="search-result"><i class="fa-solid fa-xmark"></i><span>${t('common.no_results')}</span></div>`;
        results.querySelectorAll('.search-result[data-page]').forEach(el => {
            el.addEventListener('click', () => { navigateTo(el.dataset.page); $('#searchModal').classList.add('hidden'); });
        });
    }

    $('#searchInput').addEventListener('input', e => doSearch(e.target.value.toLowerCase().trim()));
    $('#searchInput').addEventListener('keydown', e => {
        const results = $('#searchResults');
        const items = results.querySelectorAll('.search-result[data-page]');
        if (!items.length) return;
        let idx = -1;
        items.forEach((el, i) => { if (el.classList.contains('sr-active')) idx = i; });
        if (e.key === 'ArrowDown') { e.preventDefault(); items.forEach(el => el.classList.remove('sr-active')); idx = (idx + 1) % items.length; items[idx].classList.add('sr-active'); items[idx].scrollIntoView({ block: 'nearest' }); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); items.forEach(el => el.classList.remove('sr-active')); idx = idx <= 0 ? items.length - 1 : idx - 1; items[idx].classList.add('sr-active'); items[idx].scrollIntoView({ block: 'nearest' }); }
        else if (e.key === 'Enter') { e.preventDefault(); const active = results.querySelector('.sr-active[data-page]'); if (active) { navigateTo(active.dataset.page); $('#searchModal').classList.add('hidden'); } }
    });

    $('#searchModal').addEventListener('click', e => { if (e.target.id === 'searchModal') e.target.classList.add('hidden'); });
}

function openSearch() {
    $('#searchModal').classList.remove('hidden');
    const inp = $('#searchInput');
    inp.value = '';
    $('#searchResults').innerHTML = '';
    setTimeout(() => inp.focus(), 50);
}

// ═══════════════════════════════════════════
// LANGUAGE SELECTOR
// ═══════════════════════════════════════════
function initLangSelector() {
    const flag = $('#sfLangFlag');
    const btn = $('#sfLangBtn');
    const dd = $('#sfLangDropdown');
    if (!flag || !btn || !dd) return;
    function render() {
        const cur = sfGetLang();
        flag.textContent = SF_LANGS[cur]?._flag || '🌐';
        dd.innerHTML = Object.keys(SF_LANGS).map(k => {
            const l = SF_LANGS[k];
            return `<div class="lang-option${k===cur?' active':''}" data-lang="${k}"><span class="lang-flag">${l._flag}</span><span>${l._name}</span></div>`;
        }).join('');
        dd.querySelectorAll('.lang-option').forEach(opt => {
            opt.addEventListener('click', () => {
                sfSetLang(opt.dataset.lang);
                dd.classList.add('hidden');
                renderSidebar();
                $$('.nav-item').forEach(el => el.classList.toggle('active', el.dataset.page === currentPage));
                renderPage(currentPage);
                render();
                // Update top bar static text
                updateTopBarLang();
            });
        });
    }
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        dd.classList.toggle('hidden');
    });
    render();
    updateTopBarLang();
}
function updateTopBarLang() {
    const cb = $('#connectBtn span');
    if (cb) cb.textContent = t('topbar.connect');
    const cs = $('#connectionStatus .status-label');
    if (cs && !tiktokUsername) cs.textContent = t('topbar.disconnected');
    const dl = $('.discord-link span');
    if (dl) dl.innerHTML = t('topbar.help') + ' <b>' + t('topbar.discord') + '</b>';
}

// ═══════════════════════════════════════════
// PAGE ROUTER
// ═══════════════════════════════════════════
function renderPage(page) {
    const main = $('#mainContent');
    const loader = $('#pageLoader');
    if (loader) loader.classList.add('hidden');

    switch (page) {
        case 'start':            main.innerHTML = pageStart(); initStart(); break;
        case 'setup':            main.innerHTML = pageSetup(); initSetup(); break;
        case 'obsoverlays':      main.innerHTML = pageOverlays(); bindOverlayActions(); break;
        case 'giftcatalog':      main.innerHTML = pageGiftCatalog(); initGiftCatalog(); break;
        case 'actionsandevents': main.innerHTML = pageActions(); initActions(); break;
        case 'sounds':           main.innerHTML = pageSounds(); initSounds(); break;
        case 'chatbot':          main.innerHTML = pageChatbot(); initChatbot(); break;
        case 'chatcommands':     main.innerHTML = pageChatCommands(); initChatCommands(); break;
        case 'user':             main.innerHTML = pageUser(); initUser(); break;
        case 'songrequests':     main.innerHTML = pageSongRequests(); initSongRequests(); break;
        case 'likeathon':        main.innerHTML = pageLikeathon(); initLikeathon(); break;
        case 'tts':              main.innerHTML = pageTTS(); initTTS(); break;
        case 'goals':            main.innerHTML = pageGoals(); initGoals(); bindOverlayActions(); break;
        case 'giftoverlays':     main.innerHTML = pageGiftOverlays(); initGiftOverlays(); break;
        case 'graphicoverlays':  main.innerHTML = pageGraphicOverlays(); initGraphicOverlays(); break;
        case 'lastx':            main.innerHTML = pageLastX(); bindOverlayActions(); break;
        case 'obsdocks':         main.innerHTML = pageOBSDocks(); bindOverlayActions(); break;
        case 'timer':            main.innerHTML = pageTimer(); initTimer(); break;
        case 'wheel':            main.innerHTML = pageWheel(); initWheel(); break;
        case 'giftbrowser':      main.innerHTML = pageGiftBrowser(); try { initGiftBrowser(); } catch(gbErr) { console.error('[SF] giftbrowser init error:', gbErr); } break;
        case 'coindrop':         main.innerHTML = pageCoinDrop(); break;
        case 'challenge':        main.innerHTML = pageChallenge(); initChallenge(); break;
        case 'halving':          main.innerHTML = pageHalving(); initHalving(); break;
        case 'cchub':            main.innerHTML = pageCCHub(); initCCHub(); break;
        case 'ccgames':          main.innerHTML = pageCCGames(); initCCGames(); break;
        case 'ccpolls':          main.innerHTML = pageCCPolls(); initCCPolls(); break;
        case 'ccshop':           main.innerHTML = pageCCShop(); initCCShop(); break;
        case 'ccleaderboard':    main.innerHTML = pageCCLeaderboard(); initCCLeaderboard(); break;
        case 'ccplay':           main.innerHTML = pageCCPlay(); initCCPlay(); break;
        case 'ccregister':       main.innerHTML = pageCCRegister(); initCCRegister(); break;
        case 'cclogin':          main.innerHTML = pageCCLogin(); initCCLogin(); break;
        case 'ccprofile':        main.innerHTML = pageCCProfile(); initCCProfile(); break;
        case 'ccsettings':       main.innerHTML = pageCCSettings(); initCCSettings(); break;
        case 'streamkey':        main.innerHTML = pageStreamKey(); initStreamKey(); break;
        case 'livechannels':     main.innerHTML = pageLiveChannels(); initLiveChannels(); break;
        case 'activitylog':      main.innerHTML = pageActivityLog(); initActivityLog(); break;
        case 'dapi':             main.innerHTML = pageDAPI(); break;
        case 'transactions':     main.innerHTML = pageTransactions(); initTransactions(); break;
        default:                 main.innerHTML = pageGeneric(page); break;
    }
}

// ═══════════════════════════════════════════
// PAGE: START
// ═══════════════════════════════════════════
function pageStart() {
    return `
    <div class="page-banner"><i class="fa-solid fa-download"></i> ${t('start.banner')}</div>
    <div class="page-header">
        <h1>${t('start.welcome')}</h1>
        <p>${t('start.desc')}</p>
    </div>
    <div class="page-body">
        <div class="stat-grid">
            <div class="stat-card"><div class="stat-label">${t('start.tiktok_live')}</div><div class="stat-value" id="sfTikTokStatus" style="color:var(--text-muted)">--</div><div class="stat-sub" id="sfTikTokSub">${t('start.not_connected')}</div></div>
            <div class="stat-card"><div class="stat-label">${t('start.viewers')}</div><div class="stat-value" id="sfViewerCount" style="color:var(--accent)">0</div><div class="stat-sub">${t('start.current_viewers')}</div></div>
            <div class="stat-card"><div class="stat-label">${t('start.likes')}</div><div class="stat-value" id="sfLikeCount" style="color:var(--pink)">0</div><div class="stat-sub">${t('start.total_likes')}</div></div>
            <div class="stat-card"><div class="stat-label">${t('start.plan')}</div><div class="stat-value" style="color:var(--yellow)">PRO</div><div class="stat-sub">${t('start.all_features')}</div></div>
        </div>
        <div class="stat-grid" id="sfDashExtra" style="display:none;margin-top:-8px">
            <div class="stat-card"><div class="stat-label"><i class="fa-solid fa-gift" style="color:var(--red);margin-right:4px"></i> Gifts</div><div class="stat-value" id="sfGiftCount" style="color:var(--red);font-size:22px">0</div><div class="stat-sub"><span id="sfDiamondCount">0</span> diamonds</div></div>
            <div class="stat-card"><div class="stat-label"><i class="fa-solid fa-user-plus" style="color:var(--green);margin-right:4px"></i> Followers</div><div class="stat-value" id="sfFollowCount" style="color:var(--green);font-size:22px">0</div><div class="stat-sub"><span id="sfShareCount">0</span> shares</div></div>
            <div class="stat-card"><div class="stat-label"><i class="fa-solid fa-message" style="color:var(--blue);margin-right:4px"></i> Chat</div><div class="stat-value" id="sfChatCount" style="color:var(--blue);font-size:22px">0</div><div class="stat-sub">messages</div></div>
            <div class="stat-card"><div class="stat-label"><i class="fa-solid fa-clock" style="color:var(--purple);margin-right:4px"></i> Session</div><div class="stat-value" id="sfSessionTime" style="color:var(--purple);font-size:22px">--:--</div><div class="stat-sub" id="sfTopGifter">--</div></div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:20px">
            <button class="btn-primary" id="sfQuickConnect"><i class="fa-solid fa-tower-broadcast"></i> ${t('start.connect_btn')}</button>
            <button class="btn btn-danger" id="sfQuickDisconnect" style="display:none"><i class="fa-solid fa-plug-circle-xmark"></i> ${t('start.disconnect_btn')}</button>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-zap"></i> Quick Access</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:12px">
                <button class="btn" onclick="navigateTo('actionsevents')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-bolt" style="font-size:20px;color:var(--accent)"></i><span style="font-size:11px">Actions & Events</span></button>
                <button class="btn" onclick="navigateTo('tts')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-microphone" style="font-size:20px;color:var(--pink)"></i><span style="font-size:11px">Text-to-Speech</span></button>
                <button class="btn" onclick="navigateTo('sounds')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-volume-high" style="font-size:20px;color:var(--blue)"></i><span style="font-size:11px">Sound Alerts</span></button>
                <button class="btn" onclick="navigateTo('goals')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-bullseye" style="font-size:20px;color:var(--green)"></i><span style="font-size:11px">Goals</span></button>
                <button class="btn" onclick="navigateTo('timer')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-stopwatch" style="font-size:20px;color:var(--yellow)"></i><span style="font-size:11px">Timer</span></button>
                <button class="btn" onclick="navigateTo('obsoverlays')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-layer-group" style="font-size:20px;color:var(--purple)"></i><span style="font-size:11px">Overlays</span></button>
            </div>
            <div id="sfQuickActions" style="display:none">
                <h4 style="font-size:12px;color:var(--text-muted);margin-bottom:8px"><i class="fa-solid fa-play"></i> Quick Fire Actions</h4>
                <div id="sfQuickActionBtns" style="display:flex;flex-wrap:wrap;gap:6px"></div>
            </div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-bolt"></i> ${t('start.live_feed')}</h3>
            <div id="sfLiveFeed" class="live-feed"><div style="color:var(--text-muted);font-size:12px;padding:12px;text-align:center">${t('start.live_feed_empty')}</div></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-rocket"></i> ${t('start.quick_start')}</h3>
            <p style="color:var(--text-dim);font-size:13px;line-height:1.7;margin-bottom:16px">
                1. ${t('start.qs1')}<br>
                2. ${t('start.qs2')}<br>
                3. ${t('start.qs3')}<br>
                4. ${t('start.qs4')}
            </p>
        </div>
    </div>`;
}
function initStart() {
    const qc = document.getElementById('sfQuickConnect');
    const qd = document.getElementById('sfQuickDisconnect');
    if (qc) qc.addEventListener('click', () => { $('#connectModal').classList.remove('hidden'); });
    if (qd) qd.addEventListener('click', async () => {
        try {
            await fetch('/api/tiktok/disconnect', { method: 'POST' });
            updateConnectionUI(false);
            sfToast(t('start.disconnected_toast'), 'info');
            if (qd) qd.style.display = 'none';
            if (qc) qc.style.display = '';
        } catch (_) {}
    });
    // Quick Fire Actions — load actions for one-click triggering
    fetch('/api/actions?profile='+getActiveProfileId()).then(r=>r.json()).then(d=>{
        const actions = (d.actions||[]).filter(a=>a.enabled);
        if (!actions.length) return;
        const wrap = document.getElementById('sfQuickActions');
        const btns = document.getElementById('sfQuickActionBtns');
        if (!wrap||!btns) return;
        wrap.style.display = '';
        btns.innerHTML = actions.slice(0,12).map(a =>
            `<button class="btn btn-sm qa-fire" data-aid="${a.id}" title="${a.name}"><i class="fa-solid fa-play" style="margin-right:4px"></i>${a.name}</button>`
        ).join('');
        btns.querySelectorAll('.qa-fire').forEach(b => b.addEventListener('click', async () => {
            b.disabled = true; b.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
            await fetch('/api/simulate', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile_id:getActiveProfileId(),type:'manual',_forceActionId:b.dataset.aid})});
            setTimeout(()=>{ b.disabled=false; b.innerHTML='<i class="fa-solid fa-play" style="margin-right:4px"></i>'+actions.find(a=>a.id===b.dataset.aid)?.name; },1000);
        }));
    }).catch(()=>{});

    let _dashInterval = null;
    function _fmtUptime(sec) {
        const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
        return h > 0 ? h + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0') : String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
    }
    function _populateDash(s) {
        const el = document.getElementById('sfTikTokStatus');
        const sub = document.getElementById('sfTikTokSub');
        const extra = document.getElementById('sfDashExtra');
        if (s.state === 'connected') {
            if (el) { el.textContent = '@' + s.username; el.style.color = 'var(--green)'; }
            if (sub) sub.textContent = 'Connected · ' + _fmtUptime(s.uptime || 0);
            updateConnectionUI(true, s.username);
            tiktokUsername = s.username;
            const vc = document.getElementById('sfViewerCount'); if (vc) vc.textContent = (s.stats.viewerCount||0).toLocaleString();
            const lc = document.getElementById('sfLikeCount'); if (lc) lc.textContent = (s.stats.likeCount||0).toLocaleString();
            if (qd) qd.style.display = '';
            if (qc) qc.style.display = 'none';
            // Extra dashboard stats
            if (extra) extra.style.display = '';
            const gc = document.getElementById('sfGiftCount'); if (gc) gc.textContent = (s.stats.totalGifts||0).toLocaleString();
            const dc = document.getElementById('sfDiamondCount'); if (dc) dc.textContent = (s.stats.totalDiamonds||0).toLocaleString();
            const fc = document.getElementById('sfFollowCount'); if (fc) fc.textContent = (s.stats.followers||0).toLocaleString();
            const sc = document.getElementById('sfShareCount'); if (sc) sc.textContent = (s.stats.shares||0).toLocaleString();
            const cc = document.getElementById('sfChatCount'); if (cc) cc.textContent = (s.stats.chatMessages||0).toLocaleString();
            const st = document.getElementById('sfSessionTime'); if (st) st.textContent = _fmtUptime(s.uptime || 0);
        } else {
            if (el) { el.textContent = t('start.offline'); el.style.color = 'var(--text-muted)'; }
            if (sub) sub.textContent = t('start.not_connected');
            if (extra) extra.style.display = 'none';
        }
    }
    fetch('/api/tiktok/status').then(r => r.json()).then(s => {
        _populateDash(s);
        // Fetch top gifter from recent events
        if (s.state === 'connected') {
            fetch('/api/tiktok/events?type=gift&limit=100').then(r=>r.json()).then(d => {
                const gifts = d.events || [];
                if (!gifts.length) return;
                const byUser = {};
                gifts.forEach(g => { const u = g.uniqueId || g.nickname || 'viewer'; byUser[u] = (byUser[u]||0) + (g.diamondCount||0)*(g.repeatCount||1); });
                const top = Object.entries(byUser).sort((a,b)=>b[1]-a[1])[0];
                const tg = document.getElementById('sfTopGifter');
                if (tg && top) tg.innerHTML = '<i class="fa-solid fa-crown" style="color:var(--yellow);margin-right:3px"></i> @' + top[0] + ' (' + top[1].toLocaleString() + '💎)';
            }).catch(()=>{});
        }
    }).catch(() => {});
    // Auto-refresh dashboard every 10s while on start page
    if (_dashInterval) clearInterval(_dashInterval);
    _dashInterval = setInterval(() => {
        if (!document.getElementById('sfTikTokStatus')) { clearInterval(_dashInterval); return; }
        fetch('/api/tiktok/status').then(r=>r.json()).then(_populateDash).catch(()=>{});
    }, 10000);
}

// ═══════════════════════════════════════════
// PAGE: SETUP (14 sub-pages matching TikFinity)
// ═══════════════════════════════════════════
function buildSetupTabs() { return [
    { id:'connect',    label:t('setup.connect_tiktok'),  icon:'fa-solid fa-tower-broadcast' },
    { id:'points',     label:t('setup.points_system'),   icon:'fa-solid fa-coins' },
    { id:'subscriber', label:t('setup.subscriber_bonus'),icon:'fa-solid fa-crown' },
    { id:'levels',     label:t('setup.level_settings'),  icon:'fa-solid fa-layer-group' },
    { id:'obs',        label:t('setup.obs_connection'),   icon:'fa-solid fa-video' },
    { id:'streamerbot',label:t('setup.streamerbot'),      icon:'fa-solid fa-robot' },
    { id:'minecraft',  label:t('setup.minecraft'),        icon:'fa-solid fa-cube' },
    { id:'reset',      label:t('setup.reset_points'),     icon:'fa-solid fa-rotate-left' },
    { id:'pro',        label:t('setup.pro'),              icon:'fa-solid fa-rocket' },
    { id:'patreon',    label:t('setup.patreon'),           icon:'fa-brands fa-patreon' },
    { id:'account',    label:t('setup.your_account'),      icon:'fa-solid fa-user' },
    { id:'importexport',label:t('setup.import_export'),   icon:'fa-solid fa-file-import' },
    { id:'advanced',   label:t('setup.advanced'),          icon:'fa-solid fa-sliders' },
    { id:'debug',      label:t('setup.debug'),             icon:'fa-solid fa-bug' },
]; }
let setupTab = 'connect';

function pageSetup() {
    const tabs = buildSetupTabs().map(tb => `<div class="setup-tab${setupTab===tb.id?' active':''}" data-stab="${tb.id}"><i class="${tb.icon}"></i> ${tb.label}</div>`).join('');
    return `
    <div class="page-header"><h1>${t('setup.title')}</h1><p>${t('setup.desc')}</p></div>
    <div class="setup-layout">
        <div class="setup-sidebar">${tabs}</div>
        <div class="page-body setup-content" id="sfSetupContent">${renderSetupTab(setupTab)}</div>
    </div>`;
}
function initSetup() {
    $$('.setup-tab').forEach(t => t.addEventListener('click', () => {
        setupTab = t.dataset.stab;
        $$('.setup-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        document.getElementById('sfSetupContent').innerHTML = renderSetupTab(setupTab);
        bindSetupTab(setupTab);
    }));
    bindSetupTab(setupTab);
}
function bindSetupTab(tab) {
    $$('.copy-url-btn').forEach(btn => btn.addEventListener('click', () => {
        navigator.clipboard.writeText(btn.dataset.url).then(() => {
            const orig = btn.innerHTML; btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!'; setTimeout(() => btn.innerHTML = orig, 1500);
        }).catch(() => prompt('Copy:', btn.dataset.url));
    }));
    if (tab === 'reset') {
        const btn = document.getElementById('sfResetPoints');
        if (btn) btn.addEventListener('click', () => sfConfirm(t('setup.reset.confirm'), () => sfToast(t('setup.reset.done'), 'success')));
    }
    // Theme & accent color handlers (account tab)
    const themeToggle = document.getElementById('sfThemeToggle');
    if (themeToggle) themeToggle.addEventListener('change', () => {
        const theme = themeToggle.checked ? 'dark' : 'light';
        sfSaveGlobal('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
        sfToast('Theme: ' + theme, 'info');
    });
    const compactToggle = document.getElementById('sfCompactToggle');
    if (compactToggle) compactToggle.addEventListener('change', () => {
        sfSaveGlobal('compactSidebar', compactToggle.checked);
        document.getElementById('sidebar')?.classList.toggle('compact', compactToggle.checked);
        sfToast(compactToggle.checked ? 'Compact sidebar on' : 'Compact sidebar off', 'info');
    });
    document.querySelectorAll('.accent-swatch').forEach(sw => {
        sw.addEventListener('click', () => {
            const color = sw.dataset.color;
            sfSaveGlobal('accentColor', color);
            document.documentElement.style.setProperty('--accent', color);
            document.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('active'));
            sw.classList.add('active');
            const custom = document.getElementById('sfAccentCustom');
            if (custom) custom.value = color;
        });
    });
    const accentCustom = document.getElementById('sfAccentCustom');
    if (accentCustom) accentCustom.addEventListener('input', () => {
        sfSaveGlobal('accentColor', accentCustom.value);
        document.documentElement.style.setProperty('--accent', accentCustom.value);
        document.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('active'));
    });
    const langSelect = document.getElementById('sfLangSelect');
    if (langSelect) langSelect.addEventListener('change', () => {
        sfSetLang(langSelect.value);
        renderSidebar();
        renderPage(currentPage);
        updateTopBarLang();
    });
    if (tab === 'importexport') {
        const exp = document.getElementById('sfExportAll');
        const status = document.getElementById('sfExportStatus');
        if (exp) exp.addEventListener('click', async () => {
            exp.disabled = true; exp.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Exporting...';
            if (status) status.textContent = '';
            const checks = {};
            document.querySelectorAll('.ie-check').forEach(c => { checks[c.dataset.key] = c.checked; });
            const data = { _version: 2, _exportedAt: new Date().toISOString(), _profile: getActiveProfileId() };
            // Local settings
            if (checks.local) {
                data.local = { sounds: sfLoad('sounds',[]), commands: sfLoad('commands',[]), giftoverlays: sfLoad('giftoverlays',[]), graphics: sfLoad('graphics',[]), tts: sfLoad('tts',{}), likeathon: sfLoad('likeathon',{}) };
            }
            if (checks.setup) {
                data.setup = sfLoad('setup', {});
            }
            // Server-side data
            try {
                const pid = getActiveProfileId();
                if (checks.actions) {
                    const [actRes, evtRes] = await Promise.all([
                        fetch('/api/actions?profile='+pid).then(r=>r.json()),
                        fetch('/api/events?profile='+pid).then(r=>r.json())
                    ]);
                    data.serverActions = actRes.actions || [];
                    data.serverEvents = evtRes.events || [];
                }
                if (checks.goals) {
                    const gRes = await fetch('/api/goals?profile='+pid).then(r=>r.json());
                    data.serverGoals = gRes.goals || [];
                }
                if (checks.timers) {
                    const tRes = await fetch('/api/action-timers?profile='+pid).then(r=>r.json());
                    data.serverTimers = tRes.timers || [];
                }
                if (checks.chatbot) {
                    const cRes = await fetch('/api/tiktok/chat/rules').then(r=>r.json());
                    data.chatbotRules = cRes.rules || [];
                }
            } catch(e) { console.warn('Export server data error:', e); }
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'streamfinity-backup-' + new Date().toISOString().slice(0,10) + '.json'; a.click();
            const sections = Object.keys(data).filter(k => !k.startsWith('_')).length;
            if (status) status.textContent = sections + ' sections exported';
            exp.disabled = false; exp.innerHTML = '<i class="fa-solid fa-download"></i> ' + t('setup.ie.export_btn');
            sfToast(t('setup.ie.export_done'), 'success');
        });
        const imp = document.getElementById('sfImportFile');
        const preview = document.getElementById('sfImportPreview');
        if (imp) imp.addEventListener('change', e => {
            const file = e.target.files[0]; if (!file) return;
            const reader = new FileReader();
            reader.onload = async ev => {
                try {
                    const data = JSON.parse(ev.target.result);
                    // Show preview
                    const parts = [];
                    if (data.local) parts.push('Local settings (sounds, commands, overlays)');
                    if (data.setup) parts.push('Setup & config');
                    if (data.serverActions) parts.push(data.serverActions.length + ' actions');
                    if (data.serverEvents) parts.push(data.serverEvents.length + ' events');
                    if (data.serverGoals) parts.push(data.serverGoals.length + ' goals');
                    if (data.serverTimers) parts.push(data.serverTimers.length + ' action timers');
                    if (data.chatbotRules) parts.push(data.chatbotRules.length + ' chatbot rules');
                    // V1 fallback
                    if (!data._version && (data.actions || data.sounds)) parts.push('Legacy backup (v1)');
                    if (preview) {
                        preview.style.display = '';
                        preview.innerHTML = '<div style="margin-bottom:8px;font-weight:600">Backup contents:</div><ul style="margin:0 0 12px 16px;color:var(--text-dim)">' + parts.map(p=>'<li>'+p+'</li>').join('') + '</ul><button class="btn-primary btn-sm" id="sfImportConfirm"><i class="fa-solid fa-file-import"></i> Import All</button> <button class="btn btn-sm" id="sfImportCancel">Cancel</button>';
                        document.getElementById('sfImportCancel').addEventListener('click', () => { preview.style.display = 'none'; imp.value = ''; });
                        document.getElementById('sfImportConfirm').addEventListener('click', async () => {
                            // V1 fallback
                            if (!data._version) {
                                if (data.actions) sfSave('actions', data.actions);
                                if (data.sounds) sfSave('sounds', data.sounds);
                                if (data.commands) sfSave('commands', data.commands);
                                if (data.goals) sfSave('goals', data.goals);
                                if (data.giftoverlays) sfSave('giftoverlays', data.giftoverlays);
                                if (data.graphics) sfSave('graphics', data.graphics);
                                sfToast(t('setup.ie.import_done'), 'success');
                                preview.style.display = 'none';
                                return;
                            }
                            // V2 import
                            if (data.local) {
                                Object.entries(data.local).forEach(([k,v]) => sfSave(k, v));
                            }
                            if (data.setup) sfSave('setup', data.setup);
                            const pid = getActiveProfileId();
                            try {
                                if (data.serverActions && data.serverActions.length) {
                                    for (const a of data.serverActions) {
                                        await fetch('/api/actions', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...a, profile_id: pid, id: undefined}) });
                                    }
                                }
                                if (data.serverEvents && data.serverEvents.length) {
                                    for (const ev of data.serverEvents) {
                                        await fetch('/api/events', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...ev, profile_id: pid, id: undefined}) });
                                    }
                                }
                                if (data.serverGoals && data.serverGoals.length) {
                                    for (const g of data.serverGoals) {
                                        await fetch('/api/goals', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...g, profile_id: pid, id: undefined}) });
                                    }
                                }
                                if (data.serverTimers && data.serverTimers.length) {
                                    for (const tm of data.serverTimers) {
                                        await fetch('/api/action-timers', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({...tm, profile_id: pid, id: undefined}) });
                                    }
                                }
                                if (data.chatbotRules && data.chatbotRules.length) {
                                    await fetch('/api/tiktok/chat/rules', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ rules: data.chatbotRules }) });
                                }
                            } catch(e) { console.warn('Import server data error:', e); }
                            sfToast(t('setup.ie.import_done'), 'success');
                            preview.style.display = 'none';
                        });
                    }
                } catch(_) { sfToast(t('setup.ie.import_error'), 'error'); }
            };
            reader.readAsText(file);
        });
    }
    if (tab === 'obs') {
        const connectBtn = $('#sfOBSConnect');
        if (connectBtn) connectBtn.addEventListener('click', async () => {
            const url = $('#sfOBSUrl')?.value || 'ws://localhost:4455';
            const pass = $('#sfOBSPass')?.value || '';
            sfSave('setup', { ...sfLoad('setup',{}), obsUrl: url, obsPass: pass });
            connectBtn.disabled = true; connectBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Connecting...';
            try {
                obsWS.disconnect();
                await obsWS.connect(url, pass);
                sfToast(t('obs.connected'), 'success');
                $('#sfOBSStatus').textContent = '✅ ' + t('topbar.connected');
                $('#sfOBSStatus').style.color = 'var(--green)';
                ['sfOBSScenes','sfOBSSources','sfOBSControls'].forEach(id => { const el = $('#'+id); if(el){el.style.opacity='1';el.style.pointerEvents='auto';} });
                // Load scenes
                const sceneData = await obsWS.getScenes();
                const sceneList = $('#sfOBSSceneList');
                if (sceneList && sceneData.scenes) {
                    sceneList.innerHTML = sceneData.scenes.map(s => `<button class="btn btn-sm sf-obs-scene ${s.sceneName===obsWS.currentScene?'btn-primary':''}" data-scene="${s.sceneName}" style="margin:2px">${s.sceneName}</button>`).join('');
                    $$('.sf-obs-scene').forEach(b => b.addEventListener('click', async () => {
                        try {
                            await obsWS.setScene(b.dataset.scene);
                            $$('.sf-obs-scene').forEach(x => x.classList.remove('btn-primary'));
                            b.classList.add('btn-primary');
                            sfToast(t('obs.scene_switched', {scene: b.dataset.scene}), 'info');
                            // Load sources for this scene
                            const sources = await obsWS.getSources(b.dataset.scene);
                            const srcList = $('#sfOBSSourceList');
                            if (srcList && sources.sceneItems) {
                                srcList.innerHTML = sources.sceneItems.map(s => `<div class="settings-row" style="padding:4px 0"><div class="settings-row-info"><div class="settings-row-label">${s.sourceName}</div><div class="settings-row-desc" style="font-size:11px">${s.inputKind||s.sourceType||'source'}</div></div><label class="toggle"><input type="checkbox" ${s.sceneItemEnabled?'checked':''} class="sf-obs-src-toggle" data-scene="${b.dataset.scene}" data-item="${s.sceneItemId}"><span class="toggle-slider"></span></label></div>`).join('');
                                $$('.sf-obs-src-toggle').forEach(t => t.addEventListener('change', async () => {
                                    try { await obsWS.setSourceVisible(t.dataset.scene, parseInt(t.dataset.item), t.checked); } catch(e) { sfToast('Error: '+e.message,'error'); t.checked = !t.checked; }
                                }));
                            }
                        } catch(e) { sfToast('Error: '+e.message, 'error'); }
                    }));
                }
            } catch(e) {
                sfToast('❌ ' + e.message, 'error');
                $('#sfOBSStatus').textContent = '❌ ' + e.message;
                $('#sfOBSStatus').style.color = 'var(--red)';
            }
            connectBtn.disabled = false; connectBtn.innerHTML = '<i class="fa-solid fa-plug"></i> ' + (obsWS.connected ? t('setup.obs.reconnect') : t('setup.obs.connect'));
        });
        $('#sfOBSDisconnect')?.addEventListener('click', () => { obsWS.disconnect(); sfToast(t('obs.disconnected'), 'info'); document.getElementById('sfSetupContent').innerHTML = renderSetupTab('obs'); bindSetupTab('obs'); });
        $('#sfOBSStartStream')?.addEventListener('click', async () => { try { await obsWS.startStream(); sfToast(t('obs.stream_started'), 'success'); } catch(e) { sfToast(e.message, 'error'); } });
        $('#sfOBSStopStream')?.addEventListener('click', async () => { try { await obsWS.stopStream(); sfToast(t('obs.stream_stopped'), 'info'); } catch(e) { sfToast(e.message, 'error'); } });
        $('#sfOBSStartRec')?.addEventListener('click', async () => { try { await obsWS.startRecording(); sfToast(t('obs.rec_started'), 'success'); } catch(e) { sfToast(e.message, 'error'); } });
        $('#sfOBSStopRec')?.addEventListener('click', async () => { try { await obsWS.stopRecording(); sfToast(t('obs.rec_stopped'), 'info'); } catch(e) { sfToast(e.message, 'error'); } });
        // Auto-load scenes if already connected
        if (obsWS.connected) setTimeout(() => $('#sfOBSConnect')?.click(), 100);
    }
}
function renderSetupTab(tab) {
    const saved = sfLoad('setup', {});
    switch(tab) {
    case 'connect': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-tower-broadcast"></i> ${t('setup.connect.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.connect.desc')}</p>
            <div class="form-group"><label>${t('setup.connect.username')}</label>
                <div class="input-with-icon"><i class="fa-solid fa-at"></i><input class="form-input" type="text" value="${tiktokUsername}" placeholder="your_username" id="sfSetupUser"></div>
                <div class="form-hint">${t('setup.connect.username_hint')}</div>
            </div>
            <div class="form-group"><label>${t('setup.connect.server_url')}</label><input class="form-input" type="text" value="${location.origin}" readonly>
                <div class="form-hint">${t('setup.connect.server_hint')}</div></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.connect.auto_connect')}</div><div class="settings-row-desc">${t('setup.connect.auto_connect_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.connect.desktop_notif')}</div><div class="settings-row-desc">${t('setup.connect.desktop_notif_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.connect.show_status')}</div><div class="settings-row-desc">${t('setup.connect.show_status_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
        </div>`;
    case 'points': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-coins"></i> ${t('setup.points.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.points.desc')}</p>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.points.enable')}</div><div class="settings-row-desc">${t('setup.points.enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.points.name')}</label><input class="form-input" type="text" value="${saved.pointsName||'Coins'}" placeholder="Coins"></div>
            <div class="form-group"><label>${t('setup.points.per_min')}</label><input class="form-input" type="number" value="${saved.pointsPerMin||1}" min="0"></div>
            <div class="form-group"><label>${t('setup.points.per_chat')}</label><input class="form-input" type="number" value="${saved.pointsPerChat||2}" min="0"></div>
            <div class="form-group"><label>${t('setup.points.per_like')}</label><input class="form-input" type="number" value="${saved.pointsPerLike||1}" min="0"></div>
            <div class="form-group"><label>${t('setup.points.per_share')}</label><input class="form-input" type="number" value="${saved.pointsPerShare||5}" min="0"></div>
            <div class="form-group"><label>${t('setup.points.per_follow')}</label><input class="form-input" type="number" value="${saved.pointsPerFollow||10}" min="0"></div>
            <div class="form-group"><label>${t('setup.points.per_gift')}</label><input class="form-input" type="number" value="${saved.pointsPerGiftCoin||1}" min="0">
                <div class="form-hint">${t('setup.points.per_gift_hint')}</div></div>
            <div class="form-group"><label>${t('setup.points.start_balance')}</label><input class="form-input" type="number" value="${saved.startBalance||100}" min="0"></div>
        </div>`;
    case 'subscriber': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-crown"></i> ${t('setup.sub.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.sub.desc')}</p>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.sub.enable')}</div><div class="settings-row-desc">${t('setup.sub.enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.sub.multiplier')}</label><input class="form-input" type="number" value="${saved.subMultiplier||2}" min="1" max="10" step="0.5">
                <div class="form-hint">${t('setup.sub.multiplier_hint')}</div></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.sub.badge')}</div><div class="settings-row-desc">${t('setup.sub.badge_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.sub.commands')}</div><div class="settings-row-desc">${t('setup.sub.commands_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.sub.priority_tts')}</div><div class="settings-row-desc">${t('setup.sub.priority_tts_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
        </div>`;
    case 'levels': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-layer-group"></i> ${t('setup.levels.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.levels.desc')}</p>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.levels.enable')}</div><div class="settings-row-desc">${t('setup.levels.enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.levels.xp_per_point')}</label><input class="form-input" type="number" value="${saved.xpPerPoint||1}" min="1"></div>
            <div class="form-group"><label>${t('setup.levels.level1_xp')}</label><input class="form-input" type="number" value="${saved.level1xp||100}" min="10"></div>
            <div class="form-group"><label>${t('setup.levels.xp_scale')}</label><input class="form-input" type="number" value="${saved.xpScale||1.5}" min="1" max="5" step="0.1">
                <div class="form-hint">${t('setup.levels.xp_scale_hint')}</div></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.levels.show_in_chat')}</div><div class="settings-row-desc">${t('setup.levels.show_in_chat_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.levels.levelup_notif')}</div><div class="settings-row-desc">${t('setup.levels.levelup_notif_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
        </div>`;
    case 'obs': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-video"></i> ${t('setup.obs.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.obs.desc')}</p>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.obs.status')}</div><div class="settings-row-desc" id="sfOBSStatus" style="color:${obsWS.connected?'var(--green)':'var(--text-muted)'}">${obsWS.connected?'✅ '+t('topbar.connected'):t('setup.obs.not_connected')}</div></div></div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.obs.url')}</label><input class="form-input" type="text" id="sfOBSUrl" value="${saved.obsUrl||'ws://localhost:4455'}" placeholder="ws://localhost:4455"></div>
            <div class="form-group"><label>${t('setup.obs.password')}</label><input class="form-input" type="password" id="sfOBSPass" value="${saved.obsPass||''}" placeholder=""></div>
            <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn-primary" id="sfOBSConnect"><i class="fa-solid fa-plug"></i> ${obsWS.connected?t('setup.obs.reconnect'):t('setup.obs.connect')}</button>
                ${obsWS.connected?'<button class="btn btn-danger" id="sfOBSDisconnect"><i class="fa-solid fa-unlink"></i> '+t('setup.obs.disconnect')+'</button>':''}
            </div>
        </div>
        <div class="settings-section" id="sfOBSScenes" style="${obsWS.connected?'':'opacity:.4;pointer-events:none'}">
            <h3><i class="fa-solid fa-display"></i> ${t('setup.obs.scenes')}</h3>
            <div id="sfOBSSceneList"><div style="color:var(--text-muted);font-size:13px">${t('setup.obs.scenes_empty')}</div></div>
        </div>
        <div class="settings-section" id="sfOBSSources" style="${obsWS.connected?'':'opacity:.4;pointer-events:none'}">
            <h3><i class="fa-solid fa-layer-group"></i> ${t('setup.obs.sources')}</h3>
            <div id="sfOBSSourceList"><div style="color:var(--text-muted);font-size:13px">${t('setup.obs.sources_empty')}</div></div>
        </div>
        <div class="settings-section" id="sfOBSControls" style="${obsWS.connected?'':'opacity:.4;pointer-events:none'}">
            <h3><i class="fa-solid fa-circle-play"></i> ${t('setup.obs.controls')}</h3>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button class="btn" id="sfOBSStartStream"><i class="fa-solid fa-tower-broadcast"></i> ${t('setup.obs.start_stream')}</button>
                <button class="btn btn-danger" id="sfOBSStopStream"><i class="fa-solid fa-stop"></i> ${t('setup.obs.stop_stream')}</button>
                <button class="btn" id="sfOBSStartRec"><i class="fa-solid fa-circle" style="color:var(--red)"></i> ${t('setup.obs.start_rec')}</button>
                <button class="btn" id="sfOBSStopRec"><i class="fa-solid fa-square"></i> ${t('setup.obs.stop_rec')}</button>
            </div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-robot"></i> ${t('setup.obs.auto_switch')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.obs.auto_switch_desc')}</div><div class="settings-row-desc">${t('setup.obs.auto_switch_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.obs.start_scene')}</label><input class="form-input" type="text" value="${saved.obsStartScene||''}" placeholder=""></div>
            <div class="form-group"><label>${t('setup.obs.end_scene')}</label><input class="form-input" type="text" value="${saved.obsEndScene||''}" placeholder=""></div>
        </div>`;
    case 'streamerbot': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-robot"></i> ${t('setup.sb.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.sb.desc')}</p>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.sb.enable')}</div><div class="settings-row-desc">${t('setup.sb.enable_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.sb.url')}</label><input class="form-input" type="text" value="${saved.sbUrl||'ws://127.0.0.1:8080'}" placeholder="ws://127.0.0.1:8080"></div>
            <div class="form-group"><label>WebSocket Endpoint</label><input class="form-input" type="text" value="/ws" readonly></div>
            <button class="btn-primary" style="margin-top:8px"><i class="fa-solid fa-plug"></i> ${t('setup.sb.test')}</button>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-paper-plane"></i> ${t('setup.sb.messages')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.sb.forward_chat')}</div><div class="settings-row-desc">${t('setup.sb.forward_chat_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.sb.forward_gifts')}</div><div class="settings-row-desc">${t('setup.sb.forward_gifts_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.sb.forward_follows')}</div><div class="settings-row-desc">${t('setup.sb.forward_follows_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
        </div>`;
    case 'minecraft': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-cube"></i> ${t('setup.mc.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.mc.desc')}</p>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.mc.enable')}</div><div class="settings-row-desc">${t('setup.mc.enable_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.mc.host')}</label><input class="form-input" type="text" value="${saved.mcHost||'localhost'}" placeholder="localhost"></div>
            <div class="form-group"><label>${t('setup.mc.port')}</label><input class="form-input" type="number" value="${saved.mcPort||25575}" placeholder="25575"></div>
            <div class="form-group"><label>${t('setup.mc.password')}</label><input class="form-input" type="password" value="${saved.mcPass||''}" placeholder=""></div>
            <button class="btn-primary" style="margin-top:8px"><i class="fa-solid fa-plug"></i> ${t('setup.mc.test')}</button>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-terminal"></i> ${t('setup.mc.templates')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:8px">${t('setup.mc.templates_desc')}</p>
            <div class="form-group"><label>${t('setup.mc.on_gift')}</label><input class="form-input" type="text" value="${saved.mcGiftCmd||'/say {user} sent {gift}!'}" placeholder="/say {user} sent {gift}!"></div>
            <div class="form-group"><label>${t('setup.mc.on_follow')}</label><input class="form-input" type="text" value="${saved.mcFollowCmd||'/say Welcome {user}!'}" placeholder="/say Welcome {user}!"></div>
        </div>`;
    case 'reset': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-rotate-left"></i> ${t('setup.reset.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.reset.desc')}</p>
            <div class="settings-section" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3)">
                <h3 style="color:var(--red)"><i class="fa-solid fa-triangle-exclamation"></i> ${t('setup.reset.danger')}</h3>
                <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('setup.reset.danger_desc')}</p>
                <button class="btn btn-danger" id="sfResetPoints"><i class="fa-solid fa-trash"></i> ${t('setup.reset.btn')}</button>
            </div>
        </div>`;
    case 'pro': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-rocket"></i> ${t('setup.pro.title')}</h3>
            <div style="text-align:center;padding:20px">
                <div style="font-size:48px;margin-bottom:12px"><i class="fa-solid fa-crown" style="color:var(--yellow)"></i></div>
                <h2 style="color:var(--white);margin-bottom:8px">${t('setup.pro.you_have')}</h2>
                <p style="color:var(--green);font-size:14px;margin-bottom:16px"><i class="fa-solid fa-check-circle"></i> ${t('setup.pro.all_unlocked')}</p>
                <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
                    <div class="card" style="padding:12px;text-align:center;min-width:120px"><i class="fa-solid fa-infinity" style="color:var(--accent);font-size:20px"></i><div style="font-size:12px;margin-top:4px">${t('setup.pro.unlimited_overlays')}</div></div>
                    <div class="card" style="padding:12px;text-align:center;min-width:120px"><i class="fa-solid fa-bolt" style="color:var(--yellow);font-size:20px"></i><div style="font-size:12px;margin-top:4px">${t('setup.pro.all_actions')}</div></div>
                    <div class="card" style="padding:12px;text-align:center;min-width:120px"><i class="fa-solid fa-headphones" style="color:var(--blue);font-size:20px"></i><div style="font-size:12px;margin-top:4px">${t('setup.pro.tts_chat')}</div></div>
                    <div class="card" style="padding:12px;text-align:center;min-width:120px"><i class="fa-brands fa-spotify" style="color:var(--green);font-size:20px"></i><div style="font-size:12px;margin-top:4px">${t('setup.pro.song_requests')}</div></div>
                </div>
                <p style="color:var(--text-muted);font-size:11px;margin-top:16px">${t('setup.pro.license')}</p>
            </div>
        </div>`;
    case 'patreon': return `
        <div class="settings-section">
            <h3><i class="fa-brands fa-patreon"></i> ${t('setup.patreon.title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.patreon.desc')}</p>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.patreon.enable')}</div><div class="settings-row-desc">${t('setup.patreon.enable_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <button class="btn-primary" style="margin-top:12px"><i class="fa-brands fa-patreon"></i> ${t('setup.patreon.connect')}</button>
            <div class="form-hint" style="margin-top:8px">${t('setup.patreon.hint')}</div>
        </div>`;
    case 'account': {
        const prof = getActiveProfile();
        return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-user"></i> ${t('setup.account.title')}</h3>
            <div class="form-group"><label>${t('setup.account.active_profile')}</label><input class="form-input" type="text" value="${prof ? prof.name : 'None'}" readonly></div>
            <div class="form-group"><label>${t('setup.account.tiktok_username')}</label><input class="form-input" type="text" value="${prof?.tiktokUsername ? '@'+prof.tiktokUsername : t('start.not_connected')}" readonly></div>
            <div class="form-group"><label>${t('setup.account.channel_id')}</label><input class="form-input" type="text" value="${prof ? prof.channelId : 'N/A'}" readonly></div>
            <div class="form-group"><label>${t('setup.account.screen_id')}</label><input class="form-input" type="text" value="${prof ? prof.screenId : '1'}" readonly></div>
            <div class="form-group"><label>${t('setup.account.plan')}</label><input class="form-input" type="text" value="StreamFinity Pro (Lifetime)" readonly></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-palette"></i> ${t('setup.account.appearance')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.account.dark_mode')}</div><div class="settings-row-desc">${t('setup.account.dark_mode_desc')}</div></div><label class="toggle"><input type="checkbox" id="sfThemeToggle" ${(sfLoadGlobal('theme','dark')==='dark')?'checked':''}><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.account.compact_sidebar')}</div><div class="settings-row-desc">${t('setup.account.compact_sidebar_desc')}</div></div><label class="toggle"><input type="checkbox" id="sfCompactToggle" ${sfLoadGlobal('compactSidebar',false)?'checked':''}><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>Accent Color</label>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:4px">
                    ${['#8b5cf6','#6366f1','#3b82f6','#06b6d4','#10b981','#f59e0b','#ef4444','#ec4899','#f97316','#84cc16'].map(c => '<div class="accent-swatch'+(sfLoadGlobal('accentColor','#8b5cf6')===c?' active':'')+'" data-color="'+c+'" style="width:28px;height:28px;border-radius:8px;background:'+c+';cursor:pointer;border:2px solid transparent;transition:border-color .15s"></div>').join('')}
                    <input type="color" id="sfAccentCustom" value="${sfLoadGlobal('accentColor','#8b5cf6')}" style="width:28px;height:28px;border:none;padding:0;cursor:pointer;border-radius:8px;background:transparent" title="Custom color">
                </div>
            </div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.account.language')}</label><select class="form-select" id="sfLangSelect">${Object.keys(SF_LANGS).map(k => '<option value="'+k+'"'+(sfGetLang()===k?' selected':'')+'>'+SF_LANGS[k]._flag+' '+SF_LANGS[k]._name+'</option>').join('')}</select></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-key"></i> ${t('setup.account.tiktok_login')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:8px">${t('setup.account.tiktok_login_desc')}</p>
            <button class="btn-primary"><i class="fa-brands fa-tiktok"></i> ${t('setup.account.signin_tiktok')}</button>
        </div>`;
    }
    case 'importexport': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-file-export"></i> ${t('setup.ie.export_title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.ie.export_desc')}</p>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;margin-bottom:14px;font-size:13px">
                <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" class="ie-check" data-key="local" checked> Local settings (sounds, commands, overlays)</label>
                <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" class="ie-check" data-key="setup" checked> Setup & config</label>
                <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" class="ie-check" data-key="actions" checked> Actions & Events (server)</label>
                <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" class="ie-check" data-key="goals" checked> Goals (server)</label>
                <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" class="ie-check" data-key="timers" checked> Action Timers (server)</label>
                <label style="display:flex;align-items:center;gap:6px"><input type="checkbox" class="ie-check" data-key="chatbot" checked> Chatbot rules</label>
            </div>
            <button class="btn-primary" id="sfExportAll"><i class="fa-solid fa-download"></i> ${t('setup.ie.export_btn')}</button>
            <span id="sfExportStatus" style="margin-left:10px;font-size:12px;color:var(--text-muted)"></span>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-file-import"></i> ${t('setup.ie.import_title')}</h3>
            <p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">${t('setup.ie.import_desc')}</p>
            <input type="file" id="sfImportFile" accept=".json" class="form-input" style="padding:8px">
            <div id="sfImportPreview" style="display:none;margin-top:12px;padding:12px;background:var(--surface);border-radius:var(--radius);font-size:12px"></div>
        </div>`;
    case 'advanced': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-sliders"></i> ${t('setup.adv.title')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.adv.enable_dapi')}</div><div class="settings-row-desc">${t('setup.adv.enable_dapi_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.adv.log_events')}</div><div class="settings-row-desc">${t('setup.adv.log_events_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.adv.disable_antispam')}</div><div class="settings-row-desc">${t('setup.adv.disable_antispam_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('setup.adv.event_cooldown')}</label><input class="form-input" type="number" value="${saved.eventCooldown||500}" min="0" max="5000"></div>
            <div class="form-group"><label>${t('setup.adv.max_events')}</label><input class="form-input" type="number" value="${saved.maxEventsPerSec||50}" min="1" max="200"></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-keyboard"></i> ${t('setup.adv.shortcuts')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('common.search')}</div></div><kbd style="background:var(--surface);border:1px solid var(--border);padding:4px 10px;border-radius:4px;color:var(--text-dim);font-size:12px">Ctrl + K</kbd></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">Toggle Mute</div></div><kbd style="background:var(--surface);border:1px solid var(--border);padding:4px 10px;border-radius:4px;color:var(--text-dim);font-size:12px">Ctrl + M</kbd></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('nav.sounds')}</div></div><kbd style="background:var(--surface);border:1px solid var(--border);padding:4px 10px;border-radius:4px;color:var(--text-dim);font-size:12px">Ctrl + S</kbd></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('nav.tts')}</div></div><kbd style="background:var(--surface);border:1px solid var(--border);padding:4px 10px;border-radius:4px;color:var(--text-dim);font-size:12px">Ctrl + T</kbd></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-network-wired"></i> ${t('setup.adv.api_connectivity')}</h3>
            <div class="form-group"><label>WebSocket URL</label>
                <div style="display:flex;gap:8px;align-items:center"><input class="form-input" type="text" value="${location.origin.replace('http','ws')}/ws" readonly style="flex:1">
                <button class="btn btn-purple btn-sm copy-url-btn" data-url="${location.origin.replace('http','ws')}/ws"><i class="fa-regular fa-copy"></i></button></div></div>
            <div class="form-group"><label>REST API</label>
                <div style="display:flex;gap:8px;align-items:center"><input class="form-input" type="text" value="${location.origin}/api" readonly style="flex:1">
                <button class="btn btn-purple btn-sm copy-url-btn" data-url="${location.origin}/api"><i class="fa-regular fa-copy"></i></button></div></div>
        </div>`;
    case 'debug': return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-bug"></i> ${t('setup.debug.title')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.debug.enable')}</div><div class="settings-row-desc">${t('setup.debug.enable_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.debug.log_ws')}</div><div class="settings-row-desc">${t('setup.debug.log_ws_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('setup.debug.event_sim')}</div><div class="settings-row-desc">${t('setup.debug.event_sim_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-info-circle"></i> ${t('setup.debug.system_info')}</h3>
            <div class="form-group"><label>${t('setup.debug.server')}</label><input class="form-input" type="text" value="${location.origin}" readonly></div>
            <div class="form-group"><label>${t('setup.debug.version')}</label><input class="form-input" type="text" value="StreamFinity Pro v1.0.0" readonly></div>
            <div class="form-group"><label>User Agent</label><input class="form-input" type="text" value="${navigator.userAgent.substring(0,80)}..." readonly></div>
            <div class="form-group"><label>${t('setup.debug.websocket')}</label><input class="form-input" type="text" value="${wsConnected ? t('topbar.connected') : t('topbar.disconnected')}" readonly></div>
        </div>`;
    default: return `<div class="empty-state"><i class="fa-solid fa-gear"></i><h3>${t('common.select_setting')}</h3></div>`;
    }
}

// ═══════════════════════════════════════════
// PAGE: INTERACTIVE OVERLAYS
// ═══════════════════════════════════════════
function pageOverlays() {
    let cards = OVERLAYS.map(ov => {
        const badge = ov.pro ? '<span class="card-badge">PRO</span>' : '';
        const url = widgetUrl(ov.id);
        return `
        <div class="card" data-oid="${ov.id}">
            <div class="card-head"><span class="card-title">${ov.title}</span>${badge}</div>
            <div class="card-desc">${ov.desc}</div>
            <div class="card-actions">
                <button class="btn btn-purple btn-sm copy-url-btn" data-url="${url}"><i class="fa-regular fa-copy"></i> ${t('common.copy_url')}</button>
                <button class="btn btn-sm" onclick="window.open('${url}','_blank','width=400,height=600')"><i class="fa-solid fa-play"></i> ${t('common.test')}</button>
                <button class="btn btn-sm customize-overlay-btn" data-oid="${ov.id}"><i class="fa-solid fa-gear"></i> ${t('common.customize')}</button>
            </div>
            <div class="card-url"><div class="card-url-text" title="${url}">${url}</div></div>
        </div>`;
    }).join('');

    return `
    <div class="page-banner"><i class="fa-solid fa-wand-magic-sparkles"></i> ${t('overlays.banner')}</div>
    <div class="page-header">
        <h1>${t('overlays.title')}</h1>
        <p>${t('overlays.desc')}</p>
        <div class="page-note">${t('overlays.note')}</div>
    </div>
    <div class="page-body"><div class="card-grid">${cards}</div></div>`;
}

function bindOverlayActions() {
    $$('.copy-url-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(btn.dataset.url).then(() => {
                const orig = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> ' + t('common.copied');
                setTimeout(() => btn.innerHTML = orig, 1500);
            }).catch(() => prompt('Copy URL:', btn.dataset.url));
        });
    });
    $$('.customize-overlay-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const oid = btn.dataset.oid;
            const ov = OVERLAYS.find(o => o.id === oid);
            const presets = OVERLAY_PRESETS[oid] || [];
            const saved = sfLoad('overlay_cfg_' + oid, {});
            let body = `<p style="color:var(--text-dim);font-size:13px;margin-bottom:12px">Configure <strong>${ov?.title || oid}</strong> overlay settings.</p>`;
            if (presets.length) {
                body += `<div class="form-group"><label>Preset Template</label><select class="form-input" id="ovPreset">
                    <option value="">Custom</option>${presets.map((p,i) => `<option value="${i}">${p.name}</option>`).join('')}
                </select></div>`;
            }
            body += `<div class="form-group"><label>Font Size (px)</label><input class="form-input" type="number" id="ovFontSize" value="${saved.fontSize||14}" min="10" max="48"></div>`;
            body += `<div class="form-group"><label>Animation</label><select class="form-input" id="ovAnimation">
                <option value="slide" ${saved.animation==='slide'?'selected':''}>Slide</option>
                <option value="fade" ${saved.animation==='fade'?'selected':''}>Fade</option>
                <option value="pop" ${saved.animation==='pop'?'selected':''}>Pop</option>
                <option value="none" ${saved.animation==='none'?'selected':''}>None</option>
            </select></div>`;
            body += `<div class="form-group"><label>Background Color</label><input type="color" id="ovBgColor" value="${saved.bgColor||'#1a1a24'}" style="width:60px;height:32px;border:none;cursor:pointer"></div>`;
            body += `<div class="form-group"><label>Text Color</label><input type="color" id="ovTextColor" value="${saved.textColor||'#f1f1f5'}" style="width:60px;height:32px;border:none;cursor:pointer"></div>`;
            const m = sfModal('Customize: ' + (ov?.title || oid), body, () => {
                const cfg = {
                    fontSize: parseInt(document.getElementById('ovFontSize').value),
                    animation: document.getElementById('ovAnimation').value,
                    bgColor: document.getElementById('ovBgColor').value,
                    textColor: document.getElementById('ovTextColor').value,
                };
                sfSave('overlay_cfg_' + oid, cfg);
                sfToast(`${ov?.title || oid} overlay settings saved!`, 'success');
            }, 'Save Settings');
            if (presets.length) {
                m.querySelector('#ovPreset').addEventListener('change', e => {
                    const idx = e.target.value;
                    if (idx === '') return;
                    const p = presets[parseInt(idx)];
                    if (p.fontSize) m.querySelector('#ovFontSize').value = p.fontSize;
                    if (p.animation) m.querySelector('#ovAnimation').value = p.animation;
                });
            }
        });
    });
}

// ═══════════════════════════════════════════
// PAGE: ACTIONS & EVENTS (v2 — server-backed, two entities)
// ═══════════════════════════════════════════
let _aeTab = 'actions'; // 'actions' | 'events' | 'simulator'
let _aeActions = []; // cached from server
let _aeEvents = []; // cached from server

const AE_TRIGGERS = [
    'gift','follow','share','like','subscribe','join','chat_any','chat_command',
    'gift_specific','gift_min_coins','gift_streak','emote_combo','top_gifter_change',
    'first_activity','subscriber_emote','fan_club_sticker','shop_purchase','viewer_milestone'
];
const AE_EFFECTS = [
    'animation','image','audio','video','alert','tts','chat','obs_scene','obs_source',
    'webhook','minecraft','keystrokes','points_add','points_remove','streamerbot',
    'voicemod','timer_control','goal_control'
];
const AE_FILTERS = ['everyone','follower','subscriber','moderator','top_gifter','specific'];
const AE_TRIGGER_ICONS = {gift:'fa-gift',follow:'fa-user-plus',share:'fa-share',like:'fa-heart',subscribe:'fa-star',join:'fa-right-to-bracket',chat_any:'fa-comment',chat_command:'fa-terminal',gift_specific:'fa-gift',gift_min_coins:'fa-coins',gift_streak:'fa-fire',emote_combo:'fa-face-laugh',top_gifter_change:'fa-trophy',first_activity:'fa-sparkles',subscriber_emote:'fa-face-grin-stars',fan_club_sticker:'fa-note-sticky',shop_purchase:'fa-cart-shopping',viewer_milestone:'fa-flag-checkered'};
const AE_TRIGGER_COLORS = {gift:'var(--accent)',follow:'var(--green)',share:'var(--blue)',like:'var(--pink)',subscribe:'var(--yellow)',join:'var(--green)',chat_any:'var(--purple)',chat_command:'var(--purple)',gift_specific:'var(--accent)',gift_min_coins:'var(--orange)',gift_streak:'var(--orange)',emote_combo:'var(--pink)',top_gifter_change:'var(--yellow)',first_activity:'var(--green)',subscriber_emote:'var(--pink)',fan_club_sticker:'var(--accent)',shop_purchase:'var(--green)',viewer_milestone:'var(--blue)'};

function _aeProfileId() { return getActiveProfileId(); }

async function _aeLoadActions() {
    try { const r = await fetch('/api/actions?profile='+_aeProfileId()); const d = await r.json(); _aeActions = d.actions || []; } catch(_) { _aeActions = []; }
}
async function _aeLoadEvents() {
    try { const r = await fetch('/api/events?profile='+_aeProfileId()); const d = await r.json(); _aeEvents = d.events || []; } catch(_) { _aeEvents = []; }
}

function pageActions() {
    const tabs = [
        { id:'actions', label:t('actions.tab_actions'), icon:'fa-solid fa-bolt' },
        { id:'events', label:t('actions.tab_events'), icon:'fa-solid fa-tower-broadcast' },
        { id:'simulator', label:t('actions.tab_simulator'), icon:'fa-solid fa-flask' },
    ];
    return `
    <div class="page-header">
        <h1>${t('actions.title')}</h1>
        <p>${t('actions.desc')}</p>
        <div class="page-note">${t('actions.note')}</div>
    </div>
    <div class="page-body">
        <div class="ae-tabs" style="display:flex;gap:4px;margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:8px">
            ${tabs.map(tb => `<button class="btn ${_aeTab===tb.id?'btn-primary':''} ae-tab-btn" data-aetab="${tb.id}"><i class="${tb.icon}"></i> ${tb.label}</button>`).join('')}
        </div>
        <div id="sfAEContent"></div>
    </div>`;
}

async function initActions() {
    await Promise.all([_aeLoadActions(), _aeLoadEvents()]);
    _aeRenderTab();
    $$('.ae-tab-btn').forEach(b => b.addEventListener('click', () => {
        _aeTab = b.dataset.aetab;
        $$('.ae-tab-btn').forEach(x => x.classList.remove('btn-primary'));
        b.classList.add('btn-primary');
        _aeRenderTab();
    }));
}

function _aeRenderTab() {
    const el = document.getElementById('sfAEContent');
    if (!el) return;
    if (_aeTab === 'actions') el.innerHTML = _aeRenderActionsTab();
    else if (_aeTab === 'events') el.innerHTML = _aeRenderEventsTab();
    else el.innerHTML = _aeRenderSimulatorTab();
    _aeBindTab();
}

// ── ACTIONS TAB ──
function _aeRenderActionsTab() {
    const migrateBtn = userActions.length > 0 ? `<button class="btn" id="sfMigrateActions"><i class="fa-solid fa-file-import"></i> ${t('actions.migrate_btn')}</button>` : '';
    let rows = '';
    if (_aeActions.length === 0) {
        rows = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">${t('actions.no_actions')}</td></tr>`;
    } else {
        rows = _aeActions.map(a => {
            const effects = AE_EFFECTS.filter(e => a['effect_'+e]).map(e => t('actions.effect.'+e)).join(', ') || '—';
            return `<tr>
                <td style="font-weight:500;color:var(--white)">${a.name}</td>
                <td style="color:var(--text-dim);font-size:12px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${effects}</td>
                <td style="text-align:center">${a.overlay_screen}</td>
                <td><label class="toggle"><input type="checkbox" ${a.enabled?'checked':''} data-aid="${a.id}" class="ae-action-toggle"><span class="toggle-slider"></span></label></td>
                <td><button class="btn btn-sm ae-edit-action" data-aid="${a.id}"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-sm btn-danger ae-del-action" data-aid="${a.id}"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
        }).join('');
    }
    return `
        <div style="display:flex;gap:8px;margin-bottom:16px">
            <button class="btn-primary" id="sfNewAction2"><i class="fa-solid fa-plus"></i> ${t('actions.new')}</button>
            ${migrateBtn}
        </div>
        <div class="settings-section" style="padding:0;overflow:hidden">
            <table class="data-table"><thead><tr>
                <th>${t('actions.name')}</th><th>${t('actions.effects')}</th><th>${t('actions.screen')}</th><th>${t('actions.enabled_col')}</th><th></th>
            </tr></thead><tbody>${rows}</tbody></table>
        </div>`;
}

// ── EVENTS TAB ──
function _aeRenderEventsTab() {
    let rows = '';
    if (_aeEvents.length === 0) {
        rows = `<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">${t('actions.no_events')}</td></tr>`;
    } else {
        rows = _aeEvents.map(ev => {
            const icon = AE_TRIGGER_ICONS[ev.trigger_type] || 'fa-bolt';
            const color = AE_TRIGGER_COLORS[ev.trigger_type] || 'var(--accent)';
            const trigLabel = t('actions.trigger.'+ev.trigger_type) || ev.trigger_type;
            const allNames = (ev.actions_all||[]).map(id => { const a = _aeActions.find(x=>x.id===id); return a ? a.name : '?'; });
            const rndNames = (ev.actions_random||[]).map(id => { const a = _aeActions.find(x=>x.id===id); return a ? a.name : '?'; });
            let linked = allNames.join(', ');
            if (rndNames.length) linked += (linked ? ' + ' : '') + '🎲 ' + rndNames.join('/');
            return `<tr>
                <td><div class="badge-cell"><i class="fa-solid ${icon}" style="color:${color}"></i> ${trigLabel}</div></td>
                <td style="font-size:12px;color:var(--text-dim)">${t('actions.filter.'+ev.user_filter)||ev.user_filter}</td>
                <td style="font-size:12px;color:var(--text-dim);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${linked||'—'}</td>
                <td><label class="toggle"><input type="checkbox" ${ev.enabled?'checked':''} data-eid="${ev.id}" class="ae-event-toggle"><span class="toggle-slider"></span></label></td>
                <td><button class="btn btn-sm ae-edit-event" data-eid="${ev.id}"><i class="fa-solid fa-pen"></i></button> <button class="btn btn-sm btn-danger ae-del-event" data-eid="${ev.id}"><i class="fa-solid fa-trash"></i></button></td>
            </tr>`;
        }).join('');
    }
    return `
        <div style="display:flex;gap:8px;margin-bottom:16px">
            <button class="btn-primary" id="sfNewEvent2"><i class="fa-solid fa-plus"></i> ${t('actions.new_event')}</button>
        </div>
        <div class="settings-section" style="padding:0;overflow:hidden">
            <table class="data-table"><thead><tr>
                <th>${t('actions.event_trigger')}</th><th>${t('actions.user_filter')}</th><th>${t('actions.linked_actions')}</th><th>${t('actions.enabled_col')}</th><th></th>
            </tr></thead><tbody>${rows}</tbody></table>
        </div>`;
}

// ── SIMULATOR TAB ──
function _aeRenderSimulatorTab() {
    const simTriggers = ['gift','follow','share','like','subscribe','join','chat_any'].map(tr =>
        `<option value="${tr}">${t('actions.trigger.'+tr)}</option>`
    ).join('');
    return `
        <div class="settings-section">
            <h3><i class="fa-solid fa-flask"></i> ${t('actions.sim_title')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('actions.sim_desc')}</p>
            <div class="form-group"><label>${t('actions.sim_type')}</label><select class="form-input" id="sfSimType">${simTriggers}</select></div>
            <div class="form-group"><label>${t('actions.sim_username')}</label><input class="form-input" id="sfSimUser" value="TestViewer"></div>
            <div class="form-group"><label>${t('actions.sim_gift')}</label><input class="form-input" id="sfSimGift" value="Rose"></div>
            <div class="form-group"><label>${t('actions.sim_coins')}</label><input class="form-input" type="number" id="sfSimCoins" value="1" min="1"></div>
            <div class="form-group"><label>${t('actions.sim_repeat')}</label><input class="form-input" type="number" id="sfSimRepeat" value="1" min="1"></div>
            <div class="form-group"><label>${t('actions.sim_comment')}</label><input class="form-input" id="sfSimComment" placeholder="Hello!"></div>
            <button class="btn-primary" id="sfSimFire"><i class="fa-solid fa-play"></i> ${t('actions.sim_fire')}</button>
            <div id="sfSimResult" style="margin-top:12px;font-size:13px;color:var(--text-dim)"></div>
        </div>`;
}

// ── BIND TAB EVENTS ──
function _aeBindTab() {
    // Actions tab
    $('#sfNewAction2')?.addEventListener('click', () => _aeOpenActionModal());
    $('#sfMigrateActions')?.addEventListener('click', _aeMigrateLegacy);
    $$('.ae-action-toggle').forEach(el => el.addEventListener('change', async () => {
        await fetch('/api/actions/'+el.dataset.aid, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({enabled:el.checked}) });
        const a = _aeActions.find(x=>x.id===el.dataset.aid); if(a) a.enabled = el.checked;
    }));
    $$('.ae-edit-action').forEach(b => b.addEventListener('click', () => _aeOpenActionModal(b.dataset.aid)));
    $$('.ae-del-action').forEach(b => b.addEventListener('click', () => {
        sfConfirm(t('actions.delete_confirm'), async () => {
            await fetch('/api/actions/'+b.dataset.aid, {method:'DELETE'});
            _aeActions = _aeActions.filter(x=>x.id!==b.dataset.aid);
            _aeRenderTab(); sfToast(t('actions.deleted'),'info');
        });
    }));
    // Events tab
    $('#sfNewEvent2')?.addEventListener('click', () => _aeOpenEventModal());
    $$('.ae-event-toggle').forEach(el => el.addEventListener('change', async () => {
        await fetch('/api/events/'+el.dataset.eid, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify({enabled:el.checked}) });
        const ev = _aeEvents.find(x=>x.id===el.dataset.eid); if(ev) ev.enabled = el.checked;
    }));
    $$('.ae-edit-event').forEach(b => b.addEventListener('click', () => _aeOpenEventModal(b.dataset.eid)));
    $$('.ae-del-event').forEach(b => b.addEventListener('click', () => {
        sfConfirm(t('actions.event_delete_confirm'), async () => {
            await fetch('/api/events/'+b.dataset.eid, {method:'DELETE'});
            _aeEvents = _aeEvents.filter(x=>x.id!==b.dataset.eid);
            _aeRenderTab(); sfToast(t('actions.event_deleted'),'info');
        });
    }));
    // Simulator tab
    $('#sfSimFire')?.addEventListener('click', async () => {
        const res = await fetch('/api/simulate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({
            profile_id: _aeProfileId(),
            type: $('#sfSimType').value,
            username: $('#sfSimUser').value,
            giftName: $('#sfSimGift').value,
            coinValue: parseInt($('#sfSimCoins').value)||1,
            repeatCount: parseInt($('#sfSimRepeat').value)||1,
            comment: $('#sfSimComment').value,
        })});
        const d = await res.json();
        const el = $('#sfSimResult');
        if (d.executed?.length) {
            el.innerHTML = `<span style="color:var(--green)"><i class="fa-solid fa-check"></i> ${t('actions.sim_result',{count:d.executed.length})}</span><br>${d.executed.map(a=>'→ '+a.actionName+' (screen '+a.screen+')').join('<br>')}`;
        } else {
            el.innerHTML = `<span style="color:var(--text-muted)"><i class="fa-solid fa-xmark"></i> ${t('actions.sim_none')}</span>`;
        }
    });
}

// ── ACTION MODAL (create/edit) ──
function _aeOpenActionModal(actionId) {
    const a = actionId ? _aeActions.find(x=>x.id===actionId) : null;
    const cfg = a?.effect_config || {};
    const effectChecks = AE_EFFECTS.map(e => `
        <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;color:var(--text-dim);cursor:pointer">
            <input type="checkbox" class="ae-fx-check" data-fx="${e}" ${a?.['effect_'+e]?'checked':''}> ${t('actions.effect.'+e)}
        </label>`).join('');
    const screenOpts = [1,2,3,4,5,6,7,8].map(s => `<option value="${s}" ${(a?.overlay_screen||1)==s?'selected':''}>Screen ${s}</option>`).join('');
    const body = `
        <div class="form-group"><label>${t('actions.action_name')}</label><input class="form-input" id="amName" value="${a?.name||''}" placeholder="${t('actions.action_name_placeholder')}"></div>
        <div class="form-group"><label>${t('actions.description')}</label><input class="form-input" id="amDesc" value="${a?.description||''}"></div>
        <h4 style="color:var(--white);font-size:13px;margin:16px 0 8px"><i class="fa-solid fa-wand-magic-sparkles"></i> ${t('actions.effects_section')}</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 16px">${effectChecks}</div>
        <h4 style="color:var(--white);font-size:13px;margin:16px 0 8px"><i class="fa-solid fa-display"></i> ${t('actions.display_settings')}</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="form-group"><label>${t('actions.duration')}</label><input class="form-input" type="number" id="amDuration" value="${a?.duration_seconds||5}" min="0.5" step="0.5"></div>
            <div class="form-group"><label>${t('actions.overlay_screen')}</label><select class="form-input" id="amScreen">${screenOpts}</select></div>
            <div class="form-group"><label>${t('actions.volume')}</label><input class="form-input" type="number" id="amVolume" value="${a?.media_volume||80}" min="0" max="100"></div>
        </div>
        <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-size:12px">${t('actions.fade_in_out')}</div><div class="settings-row-desc">${t('actions.fade_in_out_desc')}</div></div><label class="toggle"><input type="checkbox" id="amFade" ${a?.fade_in_out?'checked':''}><span class="toggle-slider"></span></label></div>
        <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-size:12px">${t('actions.repeat_combos')}</div><div class="settings-row-desc">${t('actions.repeat_combos_desc')}</div></div><label class="toggle"><input type="checkbox" id="amRepeat" ${a?.repeat_gift_combos?'checked':''}><span class="toggle-slider"></span></label></div>
        <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-size:12px">${t('actions.skip_on_next')}</div><div class="settings-row-desc">${t('actions.skip_on_next_desc')}</div></div><label class="toggle"><input type="checkbox" id="amSkip" ${a?.skip_on_next?'checked':''}><span class="toggle-slider"></span></label></div>
        <h4 style="color:var(--white);font-size:13px;margin:16px 0 8px"><i class="fa-solid fa-clock"></i> ${t('actions.cooldowns')}</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="form-group"><label>${t('actions.global_cooldown')}</label><input class="form-input" type="number" id="amGlobalCD" value="${a?.global_cooldown||0}" min="0"><div style="font-size:10px;color:var(--text-muted)">${t('actions.global_cooldown_desc')}</div></div>
            <div class="form-group"><label>${t('actions.user_cooldown')}</label><input class="form-input" type="number" id="amUserCD" value="${a?.user_cooldown||0}" min="0"><div style="font-size:10px;color:var(--text-muted)">${t('actions.user_cooldown_desc')}</div></div>
        </div>`;
    sfModal(a ? t('actions.edit_action') : t('actions.new_action'), body, async () => {
        const data = {
            profile_id: _aeProfileId(),
            name: $('#amName').value || 'Untitled',
            description: $('#amDesc').value,
            duration_seconds: parseFloat($('#amDuration').value)||5,
            overlay_screen: parseInt($('#amScreen').value)||1,
            media_volume: parseInt($('#amVolume').value)||80,
            fade_in_out: $('#amFade').checked,
            repeat_gift_combos: $('#amRepeat').checked,
            skip_on_next: $('#amSkip').checked,
            global_cooldown: parseInt($('#amGlobalCD').value)||0,
            user_cooldown: parseInt($('#amUserCD').value)||0,
            effect_config: cfg,
        };
        $$('.ae-fx-check').forEach(c => { data['effect_'+c.dataset.fx] = c.checked; });
        if (a) {
            await fetch('/api/actions/'+a.id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
            sfToast(t('actions.updated'),'success');
        } else {
            await fetch('/api/actions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
            sfToast(t('actions.created'),'success');
        }
        await _aeLoadActions(); _aeRenderTab();
    }, a ? 'Update' : 'Create');
}

// ── EVENT MODAL (create/edit) ──
function _aeOpenEventModal(eventId) {
    const ev = eventId ? _aeEvents.find(x=>x.id===eventId) : null;
    const cfg = ev?.trigger_config || {};
    const trigOpts = AE_TRIGGERS.map(tr => `<option value="${tr}" ${ev?.trigger_type===tr?'selected':''}>${t('actions.trigger.'+tr)}</option>`).join('');
    const filterOpts = AE_FILTERS.map(f => `<option value="${f}" ${ev?.user_filter===f?'selected':''}>${t('actions.filter.'+f)}</option>`).join('');
    const actionCheckboxesAll = _aeActions.map(a => `
        <label style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;color:var(--text-dim);cursor:pointer">
            <input type="checkbox" class="ae-link-all" data-aid="${a.id}" ${(ev?.actions_all||[]).includes(a.id)?'checked':''}> ${a.name} <span style="color:var(--text-muted);font-size:10px">(screen ${a.overlay_screen})</span>
        </label>`).join('') || '<div style="color:var(--text-muted);font-size:12px;padding:8px 0">No actions created yet</div>';
    const actionCheckboxesRnd = _aeActions.map(a => `
        <label style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:12px;color:var(--text-dim);cursor:pointer">
            <input type="checkbox" class="ae-link-rnd" data-aid="${a.id}" ${(ev?.actions_random||[]).includes(a.id)?'checked':''}> ${a.name}
        </label>`).join('') || '';
    const body = `
        <div class="form-group"><label>${t('actions.name')}</label><input class="form-input" id="evName" value="${ev?.name||''}"></div>
        <h4 style="color:var(--white);font-size:13px;margin:16px 0 8px"><i class="fa-solid fa-tower-broadcast"></i> ${t('actions.trigger_type')}</h4>
        <div class="form-group"><label>${t('actions.trigger_type')}</label><select class="form-input" id="evTrigger">${trigOpts}</select></div>
        <div id="evTriggerCfg">
            <div class="form-group"><label>${t('actions.gift_name')}</label><input class="form-input" id="evGiftName" value="${cfg.gift_name||''}"></div>
            <div class="form-group"><label>${t('actions.min_coins')}</label><input class="form-input" type="number" id="evMinCoins" value="${cfg.min_coins||0}" min="0"></div>
            <div class="form-group"><label>${t('actions.command')}</label><input class="form-input" id="evCommand" value="${cfg.command||''}" placeholder="!hello"></div>
        </div>
        <h4 style="color:var(--white);font-size:13px;margin:16px 0 8px"><i class="fa-solid fa-user-shield"></i> ${t('actions.user_filter')}</h4>
        <div class="form-group"><select class="form-input" id="evFilter">${filterOpts}</select></div>
        <div class="form-group"><label>${t('actions.specific_user')}</label><input class="form-input" id="evSpecUser" value="${ev?.specific_user||''}"></div>
        <div class="form-group"><label>${t('actions.min_team_level')}</label><input class="form-input" type="number" id="evTeamLvl" value="${ev?.min_team_level||0}" min="0"></div>
        <h4 style="color:var(--white);font-size:13px;margin:16px 0 8px"><i class="fa-solid fa-link"></i> ${t('actions.actions_all')}</h4>
        <p style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${t('actions.actions_all_desc')}</p>
        <div style="max-height:150px;overflow-y:auto;padding:4px 0">${actionCheckboxesAll}</div>
        <h4 style="color:var(--white);font-size:13px;margin:16px 0 8px"><i class="fa-solid fa-shuffle"></i> ${t('actions.actions_random')}</h4>
        <p style="font-size:11px;color:var(--text-muted);margin-bottom:6px">${t('actions.actions_random_desc')}</p>
        <div style="max-height:120px;overflow-y:auto;padding:4px 0">${actionCheckboxesRnd}</div>`;
    sfModal(ev ? t('actions.edit_event') : t('actions.new_event_modal'), body, async () => {
        const trigger_config = {};
        const tt = $('#evTrigger').value;
        if (['gift','gift_specific','gift_min_coins'].includes(tt)) {
            if ($('#evGiftName').value) trigger_config.gift_name = $('#evGiftName').value;
            if (parseInt($('#evMinCoins').value)) trigger_config.min_coins = parseInt($('#evMinCoins').value);
        }
        if (tt === 'chat_command') trigger_config.command = $('#evCommand').value;
        const actionsAll = []; $$('.ae-link-all').forEach(c => { if(c.checked) actionsAll.push(c.dataset.aid); });
        const actionsRnd = []; $$('.ae-link-rnd').forEach(c => { if(c.checked) actionsRnd.push(c.dataset.aid); });
        const data = {
            profile_id: _aeProfileId(),
            name: $('#evName').value,
            trigger_type: tt,
            trigger_config,
            user_filter: $('#evFilter').value,
            specific_user: $('#evSpecUser').value || null,
            min_team_level: parseInt($('#evTeamLvl').value)||0,
            actions_all: actionsAll,
            actions_random: actionsRnd,
        };
        if (ev) {
            await fetch('/api/events/'+ev.id, { method:'PUT', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
            sfToast(t('actions.event_updated'),'success');
        } else {
            await fetch('/api/events', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(data) });
            sfToast(t('actions.event_created'),'success');
        }
        await _aeLoadEvents(); _aeRenderTab();
    }, ev ? 'Update' : 'Create');
}

// ── LEGACY MIGRATION ──
async function _aeMigrateLegacy() {
    if (!userActions.length) { sfToast(t('actions.migrate_none'),'info'); return; }
    sfConfirm(t('actions.migrate_confirm',{count:userActions.length}), async () => {
        try {
            const res = await fetch('/api/actions/migrate', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ profile_id:_aeProfileId(), legacy_actions:userActions }) });
            const d = await res.json();
            if (d.success) {
                sfToast(t('actions.migrate_done',{actions:d.migrated.actions,events:d.migrated.events}),'success');
                await Promise.all([_aeLoadActions(), _aeLoadEvents()]);
                _aeRenderTab();
            }
        } catch(e) { sfToast('Migration error: '+e.message,'error'); }
    });
}

// ═══════════════════════════════════════════
// PAGE: SOUND ALERTS
// ═══════════════════════════════════════════
let _soundLibrary = []; // cached from /api/sounds
function pageSounds() {
    const cfg = sfLoad('sound_config', { enabled: true, volume: 80, simultaneous: false, maxQueue: 10 });
    return `
    <div class="page-header">
        <h1>${t('sounds.title')}</h1>
        <p>${t('sounds.desc')}</p>
        <div class="page-note">${t('sounds.note')}</div>
    </div>
    <div class="page-body">
        <div class="settings-section">
            <h3><i class="fa-solid fa-sliders"></i> ${t('sounds.settings')}</h3>
            <div class="settings-row">
                <div class="settings-row-info"><div class="settings-row-label">${t('sounds.enable')}</div><div class="settings-row-desc">${t('sounds.enable_desc')}</div></div>
                <label class="toggle"><input type="checkbox" id="sfSndEnabled" ${cfg.enabled?'checked':''}><span class="toggle-slider"></span></label>
            </div>
            <div class="settings-row">
                <div class="settings-row-info"><div class="settings-row-label">${t('sounds.master_volume')}</div><div class="settings-row-desc"><span id="sfSndVolLabel">${cfg.volume}%</span></div></div>
                <input type="range" min="0" max="100" value="${cfg.volume}" id="sfSndVol" style="width:140px;accent-color:var(--accent)">
            </div>
            <div class="settings-row">
                <div class="settings-row-info"><div class="settings-row-label">${t('sounds.play_simultaneously')}</div><div class="settings-row-desc">${t('sounds.play_simultaneously_desc')}</div></div>
                <label class="toggle"><input type="checkbox" id="sfSndSimul" ${cfg.simultaneous?'checked':''}><span class="toggle-slider"></span></label>
            </div>
            <div class="settings-row">
                <div class="settings-row-info"><div class="settings-row-label">${t('sounds.max_queue')}</div><div class="settings-row-desc">${t('sounds.max_queue_desc')}</div></div>
                <input class="form-input" type="number" id="sfSndMaxQ" value="${cfg.maxQueue}" min="1" max="50" style="width:80px">
            </div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-upload"></i> ${t('sounds.upload')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('sounds.upload_desc')}</p>
            <div style="display:flex;gap:8px;align-items:center">
                <input type="file" id="sfSndUpload" accept=".mp3,.wav,.ogg,.webm,.m4a" style="display:none">
                <button class="btn-primary" id="sfSndUploadBtn"><i class="fa-solid fa-cloud-arrow-up"></i> ${t('sounds.choose_file')}</button>
                <span id="sfSndUploadStatus" style="color:var(--text-muted);font-size:12px"></span>
            </div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-folder-open"></i> ${t('sounds.library')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('sounds.library_desc')}</p>
            <div id="sfSndLibrary" style="display:flex;flex-wrap:wrap;gap:8px"></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h3 style="color:var(--white);font-size:15px" id="sfSoundCount">${t('sounds.my_alerts', {count: userSounds.length})}</h3>
            <button class="btn-primary" id="sfAddSound"><i class="fa-solid fa-plus"></i> ${t('sounds.add')}</button>
        </div>
        <div id="sfSoundsList" style="display:flex;flex-direction:column;gap:8px"></div>
    </div>`;
}
function initSounds() {
    loadSoundLibrary();
    renderSoundsList();
    $('#sfAddSound').addEventListener('click', () => openSoundModal());
    $('#sfSndUploadBtn').addEventListener('click', () => $('#sfSndUpload').click());
    $('#sfSndUpload').addEventListener('change', handleSoundUpload);
    // Save settings on change
    const saveCfg = () => {
        sfSave('sound_config', {
            enabled: $('#sfSndEnabled').checked,
            volume: +$('#sfSndVol').value,
            simultaneous: $('#sfSndSimul').checked,
            maxQueue: +$('#sfSndMaxQ').value
        });
    };
    $('#sfSndEnabled').addEventListener('change', saveCfg);
    $('#sfSndVol').addEventListener('input', (e) => { $('#sfSndVolLabel').textContent = e.target.value + '%'; saveCfg(); });
    $('#sfSndSimul').addEventListener('change', saveCfg);
    $('#sfSndMaxQ').addEventListener('change', saveCfg);
}
function loadSoundLibrary() {
    fetch('/api/sounds').then(r => r.json()).then(data => {
        _soundLibrary = data.sounds || [];
        renderSoundLibrary();
    }).catch(() => {});
}
function renderSoundLibrary() {
    const el = document.getElementById('sfSndLibrary');
    if (!el) return;
    el.innerHTML = _soundLibrary.map(s => `
        <div class="snd-lib-item" data-url="${s.url}" title="${s.filename}">
            <i class="fa-solid ${s.category==='defaults'?'fa-music':'fa-file-audio'}" style="color:${s.category==='defaults'?'var(--accent)':'var(--green)'}"></i>
            <span>${s.filename.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')}</span>
            ${s.category==='uploads'?'<button class="snd-lib-del" data-fn="'+s.filename+'" title="Delete"><i class="fa-solid fa-xmark"></i></button>':''}
        </div>`).join('');
    el.querySelectorAll('.snd-lib-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.closest('.snd-lib-del')) return;
            const url = item.dataset.url;
            try { new Audio(url).play().catch(() => {}); } catch {}
        });
    });
    el.querySelectorAll('.snd-lib-del').forEach(btn => {
        btn.addEventListener('click', () => {
            const fn = btn.dataset.fn;
            sfConfirm(t('sounds.delete_confirm'), () => {
                fetch('/api/sounds/' + encodeURIComponent(fn), { method: 'DELETE' }).then(r => r.json()).then(() => {
                    sfToast(t('sounds.deleted'), 'info');
                    loadSoundLibrary();
                }).catch(() => sfToast(t('sounds.upload_failed'), 'error'));
            });
        });
    });
}
function handleSoundUpload() {
    const file = $('#sfSndUpload').files[0];
    if (!file) return;
    const status = $('#sfSndUploadStatus');
    status.textContent = t('common.loading');
    const fd = new FormData();
    fd.append('sound', file);
    fetch('/api/sounds/upload', { method: 'POST', body: fd }).then(r => r.json()).then(data => {
        if (data.success) {
            status.textContent = t('sounds.uploaded') + ' ' + data.sound.filename;
            sfToast(t('sounds.uploaded'), 'success');
            loadSoundLibrary();
        } else {
            status.textContent = 'Error: ' + (data.error || t('sounds.upload_failed'));
            sfToast(data.error || t('sounds.upload_failed'), 'error');
        }
    }).catch(() => { status.textContent = t('sounds.upload_failed'); sfToast(t('sounds.upload_failed'), 'error'); });
    $('#sfSndUpload').value = '';
}
function renderSoundsList() {
    const el = document.getElementById('sfSoundCount');
    if (el) el.textContent = t('sounds.my_alerts', {count: userSounds.length});
    const list = document.getElementById('sfSoundsList');
    if (!list) return;
    if (!userSounds.length) {
        list.innerHTML = '<div style="color:var(--text-muted);font-size:13px;text-align:center;padding:24px">' + t('sounds.no_alerts') + '</div>';
        return;
    }
    list.innerHTML = userSounds.map((s, i) => `
        <div class="sound-item">
            <div class="sound-icon"><i class="fa-solid fa-music"></i></div>
            <div class="sound-info">
                <div class="sound-name">${s.name}</div>
                <div class="sound-trigger"><i class="fa-solid fa-bolt" style="font-size:10px;margin-right:4px;color:var(--accent)"></i>${s.trigger}</div>
                <div style="font-size:11px;color:var(--text-muted);margin-top:2px"><i class="fa-solid fa-volume-high" style="font-size:9px;margin-right:4px"></i>${s.volume||100}% — ${(s.file||'').split('/').pop()}</div>
            </div>
            <div class="sound-actions">
                <button class="btn btn-sm sf-sound-play" data-sidx="${i}" title="Preview"><i class="fa-solid fa-play"></i></button>
                <button class="btn btn-sm sf-sound-edit" data-sidx="${i}" title="Edit"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-danger sf-sound-del" data-sidx="${i}" title="Delete"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('');
    $$('.sf-sound-play').forEach(b => b.addEventListener('click', () => {
        const s = userSounds[+b.dataset.sidx];
        if (!s.file) return;
        sfToast(t('sounds.playing', {name: s.name}), 'info');
        const cfg = sfLoad('sound_config', { volume: 80 });
        const a = new Audio(s.file);
        a.volume = (cfg.volume / 100) * ((s.volume || 100) / 100);
        a.play().catch(() => {});
    }));
    $$('.sf-sound-edit').forEach(b => b.addEventListener('click', () => openSoundModal(+b.dataset.sidx)));
    $$('.sf-sound-del').forEach(b => b.addEventListener('click', () => {
        sfConfirm(t('sounds.delete_confirm'), () => { userSounds.splice(+b.dataset.sidx, 1); sfSave('sounds', userSounds); renderSoundsList(); sfToast(t('sounds.deleted'), 'info'); });
    }));
}
function openSoundModal(idx) {
    const s = idx !== undefined ? userSounds[idx] : null;
    const triggerGroups = [
        { label: 'Events', items: ['Any Gift','New Follower','Share','Sub / Subscribe','Like','Level Up'] },
        { label: 'Popular Gifts', items: ['Gift: Rose','Gift: GG','Gift: Drama Queen','Gift: Lion','Gift: Universe','Gift: Galaxy','Gift: Rocket','Gift: Interstellar'] },
        { label: 'Chat Commands', items: ['Chat: !airhorn','Chat: !bruh','Chat: !sound','Chat: !ding','Chat: !wow'] }
    ];
    const triggerOptions = triggerGroups.map(g =>
        `<optgroup label="${g.label}">${g.items.map(t => `<option ${s?.trigger===t?'selected':''}>${t}</option>`).join('')}</optgroup>`
    ).join('');
    // Sound file selector from library
    const fileOptions = _soundLibrary.map(f =>
        `<option value="${f.url}" ${s?.file===f.url?'selected':''}>${f.filename.replace(/\.[^.]+$/,'').replace(/[-_]/g,' ')} (${f.category})</option>`
    ).join('');
    const body = `
        <div class="form-group"><label>${t('sounds.sound_name')}</label><input class="form-input" id="smName" value="${s?.name||''}" placeholder="e.g. Airhorn, Gift Chime..."></div>
        <div class="form-group"><label>${t('sounds.trigger')}</label><select class="form-input" id="smTrigger">${triggerOptions}</select>
            <div class="form-hint">${t('sounds.trigger_hint')}</div></div>
        <div class="form-group"><label>${t('sounds.sound_file')}</label><select class="form-input" id="smFile">${fileOptions}</select>
            <div class="form-hint">${t('sounds.sound_file_hint')}</div></div>
        <div class="form-group"><label>${t('sounds.volume')}</label><div style="display:flex;align-items:center;gap:8px"><input type="range" min="0" max="100" value="${s?.volume||100}" id="smVol" style="flex:1;accent-color:var(--accent)"><span id="smVolLabel">${s?.volume||100}%</span></div></div>
        <div style="margin-top:8px"><button class="btn btn-sm" id="smTestBtn"><i class="fa-solid fa-play"></i> ${t('sounds.test_sound')}</button></div>`;
    sfModal(s ? t('sounds.edit_alert') : t('sounds.add_alert'), body, () => {
        const obj = {
            id: s?.id || 's' + Date.now(),
            name: document.getElementById('smName').value || 'Untitled',
            trigger: document.getElementById('smTrigger').value,
            file: document.getElementById('smFile').value,
            volume: +document.getElementById('smVol').value
        };
        if (idx !== undefined) userSounds[idx] = obj; else userSounds.push(obj);
        sfSave('sounds', userSounds); renderSoundsList(); sfToast(s ? t('sounds.updated') : t('sounds.added'), 'success');
    }, s ? 'Update' : 'Add');
    // Bind volume label + test button after modal renders
    setTimeout(() => {
        const vol = document.getElementById('smVol');
        const volLabel = document.getElementById('smVolLabel');
        if (vol && volLabel) vol.addEventListener('input', () => { volLabel.textContent = vol.value + '%'; });
        const testBtn = document.getElementById('smTestBtn');
        if (testBtn) testBtn.addEventListener('click', () => {
            const file = document.getElementById('smFile')?.value;
            if (!file) return;
            const a = new Audio(file);
            a.volume = (document.getElementById('smVol')?.value || 100) / 100;
            a.play().catch(() => {});
        });
    }, 100);
}

// ═══════════════════════════════════════════
// PAGE: CHATBOT
// ═══════════════════════════════════════════
function pageChatbot() {
    return `
    <div class="page-header">
        <h1>${t('chatbot.title')}</h1>
        <p>${t('chatbot.desc')}</p>
        <div class="page-note">${t('chatbot.note')}</div>
    </div>
    <div class="page-body">
        <div class="settings-section">
            <h3><i class="fa-solid fa-paper-plane"></i> ${t('chatbot.send_title')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:8px">${t('chatbot.send_desc')}</p>
            <div style="display:flex;gap:8px"><input class="form-input" id="sfBotTestMsg" placeholder="${t('chatbot.send_placeholder')}" style="flex:1"><button class="btn-primary" id="sfBotSendTest"><i class="fa-solid fa-paper-plane"></i> ${t('chatbot.send_btn')}</button></div>
            <div id="sfBotSendStatus" style="font-size:11px;color:var(--text-muted);margin-top:4px"></div>
        </div>
        <div class="settings-section">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3><i class="fa-solid fa-wand-magic-sparkles"></i> ${t('chatbot.rules_title')}</h3>
                <button class="btn btn-sm btn-primary" id="sfBotAddRule"><i class="fa-solid fa-plus"></i> ${t('chatbot.rules_add')}</button>
            </div>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:10px">${t('chatbot.rules_desc')}</p>
            <div id="sfBotRulesList"></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-scroll"></i> ${t('chatbot.chat_log')}</h3>
            <div id="sfBotChatLog" style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius);padding:12px;max-height:300px;overflow-y:auto;font-family:monospace;font-size:12px">
                <div style="color:var(--text-muted);text-align:center;padding:20px 0">${t('chatbot.chat_waiting')}</div>
            </div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-shield-halved"></i> ${t('chatbot.spam_title')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('chatbot.spam_enable')}</div><div class="settings-row-desc">${t('chatbot.spam_enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:8px"><label>${t('chatbot.spam_max')}</label><input class="form-input" type="number" value="5" min="1" max="50" style="width:80px"></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('chatbot.spam_repeat')}</div><div class="settings-row-desc">${t('chatbot.spam_repeat_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('chatbot.spam_links')}</div><div class="settings-row-desc">${t('chatbot.spam_links_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h3 style="color:var(--white);font-size:15px" id="sfCmdCount">${t('chatbot.commands_title', {count: userCommands.length})}</h3>
            <button class="btn-primary" id="sfAddCmd"><i class="fa-solid fa-plus"></i> ${t('chatbot.add_command')}</button>
        </div>
        <div id="sfCmdList" style="display:flex;flex-direction:column;gap:8px"></div>
    </div>`;
}
function initChatbot() {
    renderCmdList();
    $('#sfAddCmd').addEventListener('click', () => openCmdModal());

    // ── Send bot message ──
    const sendBtn = $('#sfBotSendTest');
    const msgInput = $('#sfBotTestMsg');
    if (sendBtn && msgInput) {
        const doSend = async () => {
            const msg = msgInput.value.trim();
            if (!msg) return sfToast(t('chatbot.enter_msg'), 'error');
            sendBtn.disabled = true;
            try {
                const res = await fetch('/api/tiktok/chat/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: msg }) });
                const data = await res.json();
                if (data.success) {
                    sfToast(t('chatbot.sent'), 'success');
                    msgInput.value = '';
                    appendChatLog({ type: 'bot', user: 'StreamFinity Bot', msg, time: new Date().toLocaleTimeString() });
                } else sfToast(data.error || 'Send failed', 'error');
            } catch (e) { sfToast('Error: ' + e.message, 'error'); }
            sendBtn.disabled = false;
        };
        sendBtn.addEventListener('click', doSend);
        msgInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doSend(); });
    }

    // ── Live chat log via WebSocket ──
    const chatLog = $('#sfBotChatLog');
    let chatLogCount = 0;
    function appendChatLog(entry) {
        if (!chatLog) return;
        if (chatLogCount === 0) chatLog.innerHTML = '';
        chatLogCount++;
        const isBot = entry.type === 'bot' || entry.type === 'botMessage';
        const isCmd = (entry.msg || '').startsWith('!');
        const color = isBot ? 'var(--green)' : isCmd ? 'var(--yellow)' : 'var(--text-dim)';
        const icon = isBot ? '<i class="fa-solid fa-robot" style="color:var(--green);font-size:10px;margin-right:3px"></i>' : isCmd ? '<i class="fa-solid fa-terminal" style="font-size:10px;margin-right:3px"></i>' : '';
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;gap:8px;padding:3px 0;border-bottom:1px solid var(--border)';
        row.innerHTML = `<span style="color:var(--text-muted);min-width:60px;flex-shrink:0">${entry.time||''}</span><span style="color:var(--accent);min-width:90px;font-weight:500;flex-shrink:0">${entry.user||''}</span><span style="color:${color}">${icon}${(entry.msg||'').replace(/</g,'&lt;')}</span>`;
        chatLog.appendChild(row);
        if (chatLogCount > 200) chatLog.removeChild(chatLog.firstChild);
        chatLog.scrollTop = chatLog.scrollHeight;
    }

    // Listen for WS events
    if (ws && ws.readyState === 1) {
        const origHandler = ws.onmessage;
        ws.onmessage = (ev) => {
            if (origHandler) origHandler(ev);
            try {
                const d = JSON.parse(ev.data);
                if (d.event?.type === 'chat' && d.data) {
                    appendChatLog({ type: 'chat', user: '@' + (d.data.uniqueId || d.data.nickname || '?'), msg: d.data.comment, time: new Date(d.data.timestamp).toLocaleTimeString() });
                }
                if (d.event?.type === 'botMessage' && d.data) {
                    appendChatLog({ type: 'bot', user: d.data.botName || 'Bot', msg: d.data.message, time: new Date(d.data.timestamp).toLocaleTimeString() });
                }
            } catch(_) {}
        };
    }

    // Load recent events into log
    fetch('/api/tiktok/events?limit=30&type=chat').then(r => r.json()).then(d => {
        if (d.events) d.events.forEach(e => appendChatLog({ type: e.type, user: '@' + (e.uniqueId || e.nickname || '?'), msg: e.comment || e.message || '', time: new Date(e.timestamp).toLocaleTimeString() }));
    }).catch(() => {});

    // ── Auto-response rules ──
    let botRules = sfLoad('botRules', []);
    const rulesList = $('#sfBotRulesList');

    function renderRules() {
        if (!rulesList) return;
        if (!botRules.length) { rulesList.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px 0">' + t('chatbot.rules_empty') + '</div>'; return; }
        rulesList.innerHTML = botRules.map((r, i) => `
            <div class="settings-row" style="padding:8px;margin-bottom:6px;border:1px solid ${r.enabled?'rgba(139,92,246,.2)':'var(--border)'};border-radius:var(--radius);background:${r.enabled?'rgba(139,92,246,.04)':'transparent'}">
                <div class="settings-row-info" style="flex:1;min-width:0">
                    <div class="settings-row-label" style="font-family:monospace;font-size:13px">${r.matchType}: <span style="color:var(--accent)">${(r.pattern||'').replace(/</g,'&lt;')}</span></div>
                    <div class="settings-row-desc" style="font-size:11px;margin-top:2px">→ ${(r.response||'').replace(/</g,'&lt;').substring(0,80)} <span style="color:var(--text-muted)">(${r.cooldown}s cooldown)</span></div>
                </div>
                <div style="display:flex;gap:4px;align-items:center;flex-shrink:0">
                    <label class="toggle"><input type="checkbox" ${r.enabled?'checked':''} class="sf-rule-toggle" data-ri="${i}"><span class="toggle-slider"></span></label>
                    <button class="btn btn-sm sf-rule-edit" data-ri="${i}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-danger sf-rule-del" data-ri="${i}"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`).join('');
        $$('.sf-rule-toggle').forEach(t => t.addEventListener('change', () => { botRules[+t.dataset.ri].enabled = t.checked; saveRules(); }));
        $$('.sf-rule-edit').forEach(b => b.addEventListener('click', () => openRuleModal(+b.dataset.ri)));
        $$('.sf-rule-del').forEach(b => b.addEventListener('click', () => sfConfirm(t('chatbot.delete_rule'), () => { botRules.splice(+b.dataset.ri, 1); saveRules(); renderRules(); sfToast(t('chatbot.rule_deleted'), 'info'); })));
    }

    function saveRules() {
        sfSave('botRules', botRules);
        fetch('/api/tiktok/chat/rules', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rules: botRules }) }).catch(() => {});
    }

    function openRuleModal(idx) {
        const r = idx !== undefined ? botRules[idx] : null;
        sfModal(t('chatbot.rule_modal'), `
            <div class="form-group"><label>${t('chatbot.match_type')}</label><select class="form-select" id="sfRuleMatch"><option value="contains" ${r?.matchType==='contains'?'selected':''}>${t('chatbot.contains')}</option><option value="exact" ${r?.matchType==='exact'?'selected':''}>${t('chatbot.exact')}</option><option value="startsWith" ${r?.matchType==='startsWith'?'selected':''}>${t('chatbot.starts_with')}</option><option value="regex" ${r?.matchType==='regex'?'selected':''}>${t('chatbot.regex')}</option></select></div>
            <div class="form-group"><label>${t('chatbot.pattern')}</label><input class="form-input" id="sfRulePattern" value="${r?.pattern||''}" placeholder="e.g. hello, !info, ^hi.*"></div>
            <div class="form-group"><label>${t('chatbot.response')}</label><textarea class="form-input" id="sfRuleResponse" rows="3" placeholder="Welcome {user}! We have {viewers} viewers watching.">${r?.response||''}</textarea></div>
            <div class="form-group"><label>${t('chatbot.rule_cooldown')}</label><input class="form-input" type="number" id="sfRuleCooldown" value="${r?.cooldown||5}" min="1" max="300"></div>
        `, () => {
            const rule = {
                id: r?.id || 'r_' + Date.now().toString(36),
                enabled: r?.enabled !== false,
                matchType: $('#sfRuleMatch').value,
                pattern: $('#sfRulePattern').value.trim(),
                response: $('#sfRuleResponse').value.trim(),
                cooldown: parseInt($('#sfRuleCooldown').value) || 5,
            };
            if (!rule.pattern || !rule.response) return sfToast(t('chatbot.pattern_required'), 'error');
            if (idx !== undefined) botRules[idx] = rule; else botRules.push(rule);
            saveRules(); renderRules();
            sfToast(idx !== undefined ? t('chatbot.rule_updated') : t('chatbot.rule_added'), 'success');
        }, r ? 'Update' : 'Add');
    }

    $('#sfBotAddRule')?.addEventListener('click', () => openRuleModal());
    renderRules();

    // Sync rules to server on load
    if (botRules.length) saveRules();
}
function renderCmdList() {
    $('#sfCmdCount').textContent = t('chatbot.commands_title', {count: userCommands.length});
    $('#sfCmdList').innerHTML = userCommands.map((c, i) => `
        <div class="cmd-item">
            <div class="cmd-prefix">${c.cmd}</div>
            <div class="cmd-info"><div class="cmd-name">${c.cmd}</div><div class="cmd-response">${c.response}</div></div>
            <div style="display:flex;gap:6px">
                <button class="btn btn-sm sf-cmd-edit" data-cidx="${i}"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-danger sf-cmd-del" data-cidx="${i}"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('');
    $$('.sf-cmd-edit').forEach(b => b.addEventListener('click', () => openCmdModal(+b.dataset.cidx)));
    $$('.sf-cmd-del').forEach(b => b.addEventListener('click', () => {
        sfConfirm(t('chatcmd.delete_confirm'), () => { userCommands.splice(+b.dataset.cidx, 1); sfSave('commands', userCommands); renderCmdList(); sfToast(t('chatcmd.deleted'), 'info'); });
    }));
}
function openCmdModal(idx) {
    const c = idx !== undefined ? userCommands[idx] : null;
    const body = `
        <div class="form-group"><label>${t('chatcmd.command')}</label><input class="form-input" id="cmCmd" value="${c?.cmd||'!'}" placeholder="!hello"></div>
        <div class="form-group"><label>${t('chatcmd.response')}</label><textarea class="form-input" id="cmResp" rows="3" placeholder="Hey {user}, welcome!">${c?.response||''}</textarea></div>
        <div class="form-group"><label>${t('chatcmd.cooldown')}</label><input class="form-input" type="number" id="cmCool" value="${c?.cooldown||5}" min="0"></div>
        <p style="color:var(--text-muted);font-size:11px;margin-top:4px">${t('chatcmd.variables')}</p>`;
    sfModal(c ? t('chatcmd.edit') : t('chatcmd.new'), body, () => {
        const obj = { cmd: document.getElementById('cmCmd').value || '!cmd', response: document.getElementById('cmResp').value || 'Response', cooldown: parseInt(document.getElementById('cmCool').value) || 5 };
        if (idx !== undefined) userCommands[idx] = obj; else userCommands.push(obj);
        sfSave('commands', userCommands); renderCmdList(); sfToast(c ? t('chatcmd.updated') : t('chatcmd.created'), 'success');
    }, c ? 'Update' : 'Add');
}

// ═══════════════════════════════════════════
// PAGE: USER / POINTS DATABASE
// ═══════════════════════════════════════════
function pageUser() {
    return `
    <div class="page-header"><h1>${t('user.title')}</h1>
        <p>${t('user.desc')}</p>
    </div>
    <div class="page-body">
        <div class="stat-grid" style="margin-bottom:20px" id="vuStats">
            <div class="stat-card"><div class="stat-label">${t('user.total_viewers')}</div><div class="stat-value" id="vuTotalViewers">--</div><div class="stat-sub">${t('user.in_database')}</div></div>
            <div class="stat-card"><div class="stat-label">${t('user.total_points')}</div><div class="stat-value" id="vuTotalPoints" style="color:var(--yellow)">--</div><div class="stat-sub">${t('user.distributed')}</div></div>
            <div class="stat-card"><div class="stat-label">${t('user.avg_level')}</div><div class="stat-value" id="vuAvgLevel" style="color:var(--accent)">--</div><div class="stat-sub">${t('user.across_all')}</div></div>
            <div class="stat-card"><div class="stat-label">${t('user.total_gifts')}</div><div class="stat-value" id="vuTotalGifts" style="color:var(--pink)">--</div><div class="stat-sub">${t('user.received')}</div></div>
        </div>
        <div class="settings-section" style="margin-bottom:16px">
            <h3><i class="fa-solid fa-sliders"></i> Points Earn Rates</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-top:8px">
                <div class="form-group" style="margin:0"><label style="font-size:11px">Chat message</label><input class="form-input vu-rate" data-key="chat" type="number" value="1" min="0" style="font-size:12px"></div>
                <div class="form-group" style="margin:0"><label style="font-size:11px">Like</label><input class="form-input vu-rate" data-key="like" type="number" value="1" min="0" style="font-size:12px"></div>
                <div class="form-group" style="margin:0"><label style="font-size:11px">Follow</label><input class="form-input vu-rate" data-key="follow" type="number" value="10" min="0" style="font-size:12px"></div>
                <div class="form-group" style="margin:0"><label style="font-size:11px">Share</label><input class="form-input vu-rate" data-key="share" type="number" value="5" min="0" style="font-size:12px"></div>
                <div class="form-group" style="margin:0"><label style="font-size:11px">Subscribe</label><input class="form-input vu-rate" data-key="subscribe" type="number" value="50" min="0" style="font-size:12px"></div>
                <div class="form-group" style="margin:0"><label style="font-size:11px">Gift (per 2 diamonds)</label><input class="form-input vu-rate" data-key="gift" type="number" value="1" min="0" style="font-size:12px"></div>
            </div>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center;flex-wrap:wrap">
            <div style="position:relative;flex:1;min-width:160px"><i class="fa-solid fa-magnifying-glass" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px"></i><input class="form-input" id="vuSearch" placeholder="${t('user.search')}" style="padding-left:32px;font-size:12px"></div>
            <select class="form-select" id="vuSort" style="width:160px;font-size:12px">
                <option value="points">${t('user.sort_points')}</option>
                <option value="level">${t('user.sort_level')}</option>
                <option value="total_gifts">${t('user.sort_gifts')}</option>
                <option value="nickname">${t('user.sort_name')}</option>
                <option value="last_seen">Last Seen</option>
            </select>
            <button class="btn btn-sm" id="vuExport"><i class="fa-solid fa-file-export"></i> ${t('common.export')}</button>
            <button class="btn btn-sm btn-danger" id="vuResetAll"><i class="fa-solid fa-rotate-left"></i> Reset All Points</button>
        </div>
        <div class="settings-section" style="padding:0;overflow:hidden">
            <div style="max-height:440px;overflow-y:auto">
                <table class="data-table" style="width:100%">
                    <thead><tr style="position:sticky;top:0;background:var(--surface);z-index:1"><th>${t('user.viewer')}</th><th>${t('user.points')}</th><th>${t('user.level')}</th><th>${t('user.gifts')}</th><th>${t('user.last_seen')}</th><th style="width:90px"></th></tr></thead>
                    <tbody id="vuBody"><tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr></tbody>
                </table>
            </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:12px;color:var(--text-muted)">
            <span id="vuPageInfo">Page 1</span>
            <div style="display:flex;gap:4px"><button class="btn btn-sm" id="vuPrev" disabled>&laquo; Prev</button><button class="btn btn-sm" id="vuNext">Next &raquo;</button></div>
        </div>
    </div>`;
}
var _vuPage = 1, _vuSort = 'points', _vuSearch = '', _vuTotal = 0, _vuPages = 1;
function _vuTimeAgo(ts) {
    if (!ts) return '\u2014';
    var s = Math.floor((Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return 'Just now';
    if (s < 3600) return Math.floor(s/60) + 'm ago';
    if (s < 86400) return Math.floor(s/3600) + 'h ago';
    return Math.floor(s/86400) + 'd ago';
}
function _vuRenderRow(v) {
    return '<tr style="border-bottom:1px solid var(--border)">' +
        '<td style="padding:7px 12px"><div style="display:flex;align-items:center;gap:8px">' +
            (v.profile_picture_url ? '<img src="'+v.profile_picture_url+'" style="width:24px;height:24px;border-radius:50%;object-fit:cover">' : '<i class="fa-solid fa-user-circle" style="color:var(--accent);font-size:18px"></i>') +
            '<span style="color:var(--white);font-weight:500">@'+v.unique_id+'</span>' +
            (v.is_follower ? '<i class="fa-solid fa-check-circle" style="color:var(--green);font-size:10px" title="Follower"></i>' : '') +
            (v.is_subscriber ? '<i class="fa-solid fa-crown" style="color:var(--yellow);font-size:10px" title="Subscriber"></i>' : '') +
            (v.is_moderator ? '<i class="fa-solid fa-shield" style="color:var(--blue);font-size:10px" title="Moderator"></i>' : '') +
        '</div></td>' +
        '<td style="padding:7px 12px;color:var(--yellow);font-weight:600"><i class="fa-solid fa-coins" style="font-size:10px;margin-right:4px"></i>' + (v.points||0).toLocaleString() + '</td>' +
        '<td style="padding:7px 12px"><span style="background:var(--accent-bg);color:var(--accent);padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">Lv.' + (v.level||1) + '</span></td>' +
        '<td style="padding:7px 12px;color:var(--text-dim)">' + (v.total_gifts||0).toLocaleString() + '</td>' +
        '<td style="padding:7px 12px;color:var(--text-muted);font-size:12px">' + _vuTimeAgo(v.last_seen) + '</td>' +
        '<td style="padding:7px 12px"><div style="display:flex;gap:4px">' +
            '<button class="btn btn-sm vu-add-pts" data-uid="'+v.unique_id+'" title="Add points"><i class="fa-solid fa-plus"></i></button>' +
            '<button class="btn btn-sm vu-sub-pts" data-uid="'+v.unique_id+'" title="Remove points"><i class="fa-solid fa-minus"></i></button>' +
        '</div></td></tr>';
}
function _vuLoad() {
    var body = document.getElementById('vuBody');
    if (!body) return;
    fetch('/api/viewers?page='+_vuPage+'&limit=30&sort='+_vuSort+'&search='+encodeURIComponent(_vuSearch)).then(function(r){return r.json();}).then(function(d) {
        _vuTotal = d.total || 0;
        _vuPages = d.pages || 1;
        var viewers = d.viewers || [];
        if (!viewers.length) {
            body.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-muted)">No viewers found</td></tr>';
        } else {
            body.innerHTML = viewers.map(_vuRenderRow).join('');
            document.querySelectorAll('.vu-add-pts').forEach(function(b) {
                b.addEventListener('click', function() { _vuAdjustPoints(b.dataset.uid, 100); });
            });
            document.querySelectorAll('.vu-sub-pts').forEach(function(b) {
                b.addEventListener('click', function() { _vuAdjustPoints(b.dataset.uid, -100); });
            });
        }
        document.getElementById('vuPageInfo').textContent = 'Page ' + _vuPage + ' of ' + _vuPages + ' (' + _vuTotal + ' viewers)';
        document.getElementById('vuPrev').disabled = _vuPage <= 1;
        document.getElementById('vuNext').disabled = _vuPage >= _vuPages;
    }).catch(function() {
        body.innerHTML = '<tr><td colspan="6" style="padding:20px;text-align:center;color:var(--text-muted)">Failed to load viewers</td></tr>';
    });
}
function _vuAdjustPoints(uid, amount) {
    fetch('/api/viewers/' + encodeURIComponent(uid) + '/points', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount, reason: 'manual' })
    }).then(function(r){return r.json();}).then(function(d) {
        if (d.success) { sfToast((amount > 0 ? '+' : '') + amount + ' pts \u2192 @' + uid + ' (now: ' + d.newPoints + ')', 'success'); _vuLoad(); }
        else sfToast(d.error || 'Failed', 'error');
    }).catch(function(e) { sfToast('Error: ' + e.message, 'error'); });
}
function _vuLoadStats() {
    fetch('/api/viewers/stats/summary').then(function(r){return r.json();}).then(function(d) {
        var el = function(id) { return document.getElementById(id); };
        if (el('vuTotalViewers')) el('vuTotalViewers').textContent = parseInt(d.total_viewers || 0).toLocaleString();
        if (el('vuTotalPoints')) el('vuTotalPoints').textContent = parseInt(d.total_points || 0).toLocaleString();
        if (el('vuAvgLevel')) el('vuAvgLevel').textContent = Math.round(parseFloat(d.avg_level || 0));
        if (el('vuTotalGifts')) el('vuTotalGifts').textContent = parseInt(d.total_gifts || 0).toLocaleString();
    }).catch(function(){});
}
function initUser() {
    _vuPage = 1; _vuSort = 'points'; _vuSearch = '';
    _vuLoad();
    _vuLoadStats();
    var searchTimer = null;
    document.getElementById('vuSearch').addEventListener('input', function() {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(function() { _vuSearch = document.getElementById('vuSearch').value.trim(); _vuPage = 1; _vuLoad(); }, 300);
    });
    document.getElementById('vuSort').addEventListener('change', function() { _vuSort = this.value; _vuPage = 1; _vuLoad(); });
    document.getElementById('vuPrev').addEventListener('click', function() { if (_vuPage > 1) { _vuPage--; _vuLoad(); } });
    document.getElementById('vuNext').addEventListener('click', function() { if (_vuPage < _vuPages) { _vuPage++; _vuLoad(); } });
    document.getElementById('vuResetAll').addEventListener('click', function() {
        sfConfirm('Reset ALL viewer points to 0? This cannot be undone.', function() {
            fetch('/api/viewers/reset-all', { method: 'POST' }).then(function(r){return r.json();}).then(function(d) {
                if (d.success) { sfToast('Reset ' + d.affected + ' viewers', 'success'); _vuLoad(); _vuLoadStats(); }
                else sfToast(d.error || 'Failed', 'error');
            }).catch(function(e) { sfToast('Error: ' + e.message, 'error'); });
        });
    });
    document.getElementById('vuExport').addEventListener('click', function() {
        fetch('/api/viewers?limit=100&sort='+_vuSort).then(function(r){return r.json();}).then(function(d) {
            var viewers = d.viewers || [];
            if (!viewers.length) return sfToast('No viewers to export', 'info');
            var csv = 'Username,Nickname,Points,Level,Gifts,Diamonds,Likes,Chats,Shares,Follower,Subscriber,LastSeen\n';
            csv += viewers.map(function(v) {
                return [v.unique_id, v.nickname, v.points, v.level, v.total_gifts, v.total_gift_diamonds, v.total_likes, v.total_chats, v.total_shares, v.is_follower, v.is_subscriber, v.last_seen].map(function(x){return '"'+(x===null?'':x)+'"';}).join(',');
            }).join('\n');
            var blob = new Blob([csv], { type: 'text/csv' });
            var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'viewers-' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
            sfToast('Exported ' + viewers.length + ' viewers', 'success');
        }).catch(function(e) { sfToast('Error: ' + e.message, 'error'); });
    });
    document.querySelectorAll('.vu-rate').forEach(function(inp) {
        var saved = sfLoad('pointRates', {});
        if (saved[inp.dataset.key] !== undefined) inp.value = saved[inp.dataset.key];
        inp.addEventListener('change', function() {
            var rates = sfLoad('pointRates', {});
            rates[inp.dataset.key] = parseInt(inp.value) || 0;
            sfSave('pointRates', rates);
        });
    });
}

// ═══════════════════════════════════════════
// PAGE: SONG REQUESTS
// ═══════════════════════════════════════════
function pageSongRequests() {

    return `
    <div class="page-header">
        <h1>${t('songs.title')}</h1>
        <p>${t('songs.desc')}</p>
        <div class="page-note">${t('songs.note')}</div>
    </div>
    <div class="page-body">
        <div class="settings-section">
            <h3><i class="fa-brands fa-spotify" style="color:var(--green)"></i> ${t('songs.spotify_connection')}</h3>
            <div id="sfSpotifyStatus"><div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('songs.spotify_status')}</div><div class="settings-row-desc">${t('songs.checking')}</div></div></div></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-music"></i> ${t('songs.now_playing')}</h3>
            <div id="sfNowPlaying"><div style="color:var(--text-muted);padding:12px">${t('songs.connect_spotify')}</div></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-terminal"></i> ${t('songs.commands')}</h3>
            <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-family:monospace;color:var(--accent)">!play &lt;song&gt;</div><div class="settings-row-desc">Request a song to be added to the queue</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-family:monospace;color:var(--accent)">!skip</div><div class="settings-row-desc">Vote to skip the current song</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-family:monospace;color:var(--accent)">!revoke</div><div class="settings-row-desc">Remove your own song request from the queue</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-sliders"></i> ${t('songs.settings')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('songs.enable')}</div><div class="settings-row-desc">${t('songs.enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:8px"><label>${t('songs.cost_play')}</label><input class="form-input" type="number" value="0" min="0" style="width:100px"> <span style="color:var(--text-muted);font-size:12px">0 = free</span></div>
            <div class="form-group"><label>${t('songs.cost_skip')}</label><input class="form-input" type="number" value="0" min="0" style="width:100px"></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('songs.allow_skip')}</div><div class="settings-row-desc">${t('songs.allow_skip_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('songs.allow_explicit')}</div><div class="settings-row-desc">${t('songs.allow_explicit_desc')}</div></div><label class="toggle"><input type="checkbox"><span class="toggle-slider"></span></label></div>
            <div class="form-group"><label>${t('songs.max_queue')}</label><input class="form-input" type="number" value="20" min="1" max="100" style="width:100px"></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-list"></i> ${t('songs.queue')}</h3>
            <div id="sfSpotifyQueue"><div style="color:var(--text-muted);padding:12px">${t('songs.queue_empty')}</div></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-search"></i> ${t('songs.search_title')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('songs.search_desc')}</p>
            <div class="form-group"><label>${t('songs.song_name')}</label><input class="form-input" id="sfSRTestSong" placeholder="Search for a song..."></div>
            <button class="btn-primary" id="sfSRTestBtn"><i class="fa-solid fa-search"></i> ${t('songs.search_btn')}</button>
            <div id="sfSRResults" style="display:flex;flex-direction:column;gap:6px;margin-top:12px"></div>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════
// PAGE: LIKE-A-THON
// ═══════════════════════════════════════════
function pageLikeathon() {
    const cfg = sfLoad('likeathon', { goal: 10000, reward: 'We reached the goal! Thank you all!', enabled: true });
    return `
    <div class="page-header">
        <h1>${t('likeathon.title')}</h1>
        <p>${t('likeathon.desc')}</p>
    </div>
    <div class="page-body">
        <div class="settings-section">
            <h3><i class="fa-solid fa-heart" style="color:var(--pink)"></i> ${t('likeathon.settings')}</h3>
            <div class="settings-row">
                <div class="settings-row-info"><div class="settings-row-label">${t('likeathon.enable')}</div><div class="settings-row-desc">${t('likeathon.enable_desc')}</div></div>
                <label class="toggle"><input type="checkbox" id="laEnabled" ${cfg.enabled?'checked':''}><span class="toggle-slider"></span></label>
            </div>
            <div class="form-group" style="margin-top:12px">
                <label>${t('likeathon.goal')}</label>
                <input class="form-input" type="number" id="laGoal" value="${cfg.goal}" min="100" step="100">
            </div>
            <div class="form-group">
                <label>${t('likeathon.reward')}</label>
                <input class="form-input" type="text" id="laReward" value="${cfg.reward}" placeholder="${t('likeathon.reward_placeholder')}">
            </div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-chart-line"></i> ${t('likeathon.progress')}</h3>
            <div class="stat-grid">
                <div class="stat-card"><div class="stat-label">${t('likeathon.current')}</div><div class="stat-value" id="laCurrent" style="color:var(--pink)">0</div></div>
                <div class="stat-card"><div class="stat-label">Goal</div><div class="stat-value" id="laGoalVal">${cfg.goal.toLocaleString()}</div></div>
                <div class="stat-card"><div class="stat-label">Progress</div><div class="stat-value" id="laPercent" style="color:var(--accent)">0%</div></div>
            </div>
            <div style="margin-top:16px">
                <div class="progress-bar"><div class="progress-fill" id="laFill" style="width:0%"></div><div class="progress-label" id="laLabel">0 / ${cfg.goal.toLocaleString()}</div></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:16px">
                <button class="btn-primary" id="laStart"><i class="fa-solid fa-play"></i> Start</button>
                <button class="btn btn-danger" id="laStop" style="display:none"><i class="fa-solid fa-stop"></i> Stop</button>
                <button class="btn" id="laReset"><i class="fa-solid fa-rotate-left"></i> Reset</button>
            </div>
            <div id="laStatus" style="font-size:12px;color:var(--text-muted);margin-top:8px"></div>
        </div>
    </div>`;
}
var _laRunning = false, _laBaseLikes = 0, _laInterval = null;
function initLikeathon() {
    var cfg = sfLoad('likeathon', { goal: 10000, reward: 'We reached the goal! Thank you all!', enabled: true });
    function saveCfg() { sfSave('likeathon', cfg); }
    function updateUI(likes) {
        var goal = cfg.goal || 10000;
        var pct = Math.min(100, Math.round((likes / goal) * 1000) / 10);
        var el = function(id) { return document.getElementById(id); };
        if (el('laCurrent')) el('laCurrent').textContent = likes.toLocaleString();
        if (el('laGoalVal')) el('laGoalVal').textContent = goal.toLocaleString();
        if (el('laPercent')) el('laPercent').textContent = pct + '%';
        if (el('laFill')) el('laFill').style.width = pct + '%';
        if (el('laLabel')) el('laLabel').textContent = likes.toLocaleString() + ' / ' + goal.toLocaleString();
        if (likes >= goal && _laRunning) {
            sfToast(cfg.reward || 'Goal reached!', 'success');
            stopLa();
        }
    }
    function pollLikes() {
        fetch('/api/tiktok/status').then(function(r){return r.json();}).then(function(d) {
            if (!d.connected) { document.getElementById('laStatus').textContent = 'Not connected to TikTok'; return; }
            var totalLikes = (d.stats && d.stats.likeCount) || 0;
            var sessionLikes = Math.max(0, totalLikes - _laBaseLikes);
            updateUI(sessionLikes);
            document.getElementById('laStatus').textContent = 'Live \u2014 tracking likes (base: ' + _laBaseLikes.toLocaleString() + ')';
        }).catch(function(){});
    }
    function startLa() {
        _laRunning = true;
        document.getElementById('laStart').style.display = 'none';
        document.getElementById('laStop').style.display = '';
        fetch('/api/tiktok/status').then(function(r){return r.json();}).then(function(d) {
            _laBaseLikes = (d.stats && d.stats.likeCount) || 0;
            updateUI(0);
            document.getElementById('laStatus').textContent = 'Started! Base likes: ' + _laBaseLikes.toLocaleString();
            _laInterval = setInterval(function() { if (!document.getElementById('laCurrent')) { clearInterval(_laInterval); return; } pollLikes(); }, 5000);
        });
        sfToast(t('likeathon.started'), 'success');
    }
    function stopLa() {
        _laRunning = false;
        if (_laInterval) { clearInterval(_laInterval); _laInterval = null; }
        document.getElementById('laStart').style.display = '';
        document.getElementById('laStop').style.display = 'none';
        document.getElementById('laStatus').textContent = 'Stopped';
    }
    document.getElementById('laStart').addEventListener('click', startLa);
    document.getElementById('laStop').addEventListener('click', stopLa);
    document.getElementById('laReset').addEventListener('click', function() { _laBaseLikes = 0; updateUI(0); document.getElementById('laStatus').textContent = 'Reset'; });
    document.getElementById('laGoal').addEventListener('change', function() { cfg.goal = parseInt(this.value) || 10000; saveCfg(); updateUI(0); });
    document.getElementById('laReward').addEventListener('change', function() { cfg.reward = this.value; saveCfg(); });
    document.getElementById('laEnabled').addEventListener('change', function() { cfg.enabled = this.checked; saveCfg(); });
}

// ═══════════════════════════════════════════
// PAGE: TTS
// ═══════════════════════════════════════════
function pageTTS() {
    const tts = sfLoad('tts_settings', { enabled:true, voice:'Google US English', randomVoice:false, speed:100, pitch:100, volume:70, readGifts:true, readCommands:false, allowedUsers:'all', chargePoints:0, maxLength:200 });
    return `
    <div class="page-header"><h1>${t('tts.title')}</h1>
        <p>${t('tts.desc')}</p>
        <div class="page-note">${t('tts.note')}</div>
    </div>
    <div class="settings-section" style="margin-bottom:16px;border:1px solid rgba(139,92,246,.2);background:rgba(139,92,246,.04)">
        <h3><i class="fa-solid fa-link"></i> ${t('tts.obs_url')}</h3>
        <p style="color:var(--text-dim);font-size:12px;margin-bottom:8px">${t('tts.obs_url_desc')}</p>
        <div style="display:flex;gap:8px;align-items:center"><input class="form-input" readonly value="${widgetUrl('tts','volume='+tts.volume+'&speed='+tts.speed+'&pitch='+tts.pitch+'&voice='+encodeURIComponent(tts.voice)+'&readGifts='+tts.readGifts+'&randomVoice='+tts.randomVoice+'&maxLength='+tts.maxLength)}" id="sfTTSUrl" style="flex:1;font-size:11px"><button class="btn btn-sm" onclick="navigator.clipboard.writeText(document.getElementById('sfTTSUrl').value);sfToast('URL copied!','success')"><i class="fa-solid fa-copy"></i> Copy</button></div>
    </div>
    <div class="page-body">
        <div class="settings-section">
            <h3><i class="fa-solid fa-microphone"></i> ${t('tts.general')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('tts.enable')}</div><div class="settings-row-desc">${t('tts.enable_desc')}</div></div><label class="toggle"><input type="checkbox" ${tts.enabled?'checked':''}><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('tts.voice')}</label><select class="form-select" id="sfTTSVoice">
                <option ${tts.voice==='Google US English'?'selected':''}>Google US English</option>
                <option ${tts.voice==='Google UK English'?'selected':''}>Google UK English</option>
                <option ${tts.voice==='Google Deutsch'?'selected':''}>Google Deutsch</option>
                <option ${tts.voice==='Google Espanol'?'selected':''}>Google Espanol</option>
                <option ${tts.voice==='Google Francais'?'selected':''}>Google Francais</option>
                <option ${tts.voice==='Google Portugues'?'selected':''}>Google Portugues</option>
                <option ${tts.voice==='Google Japanese'?'selected':''}>Google Japanese</option>
                <option ${tts.voice==='Google Korean'?'selected':''}>Google Korean</option>
                <option ${tts.voice==='Google Chinese'?'selected':''}>Google Chinese</option>
                <option ${tts.voice==='Google Arabic'?'selected':''}>Google Arabic</option>
            </select></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('tts.random_voice')}</div><div class="settings-row-desc">${t('tts.random_voice_desc')}</div></div><label class="toggle"><input type="checkbox" ${tts.randomVoice?'checked':''}><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('tts.speed')}</div><div class="settings-row-desc">${tts.speed}%</div></div><input type="range" min="50" max="200" value="${tts.speed}" style="width:140px;accent-color:var(--accent)"></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('tts.pitch')}</div><div class="settings-row-desc">${tts.pitch}%</div></div><input type="range" min="50" max="200" value="${tts.pitch}" style="width:140px;accent-color:var(--accent)"></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('tts.volume')}</div><div class="settings-row-desc">${tts.volume}%</div></div><input type="range" min="0" max="100" value="${tts.volume}" style="width:140px;accent-color:var(--accent)"></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-users"></i> ${t('tts.allowed_users')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('tts.allowed_desc')}</p>
            <div class="form-group"><label>${t('tts.who_can_use')}</label><select class="form-select" id="sfTTSAllowed">
                <option ${tts.allowedUsers==='all'?'selected':''} value="all">${t('tts.all_viewers')}</option>
                <option ${tts.allowedUsers==='followers'?'selected':''} value="followers">${t('tts.followers_only')}</option>
                <option ${tts.allowedUsers==='superfans'?'selected':''} value="superfans">${t('tts.superfans_only')}</option>
                <option ${tts.allowedUsers==='moderators'?'selected':''} value="moderators">${t('tts.moderators_only')}</option>
                <option ${tts.allowedUsers==='team'?'selected':''} value="team">${t('tts.team_only')}</option>
                <option ${tts.allowedUsers==='topgifters'?'selected':''} value="topgifters">${t('tts.topgifters_only')}</option>
                <option ${tts.allowedUsers==='allowlist'?'selected':''} value="allowlist">${t('tts.allowlist_only')}</option>
            </select></div>
            <div class="form-group"><label>${t('tts.allowlist')}</label><textarea class="form-input" rows="3" placeholder="username1&#10;username2&#10;username3" style="resize:vertical">${sfLoad('tts_allowlist','')}</textarea></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-comment"></i> ${t('tts.comment_types')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('tts.read_all')}</div><div class="settings-row-desc">${t('tts.read_all_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('tts.read_gifts')}</div><div class="settings-row-desc">${t('tts.read_gifts_desc')}</div></div><label class="toggle"><input type="checkbox" ${tts.readGifts?'checked':''}><span class="toggle-slider"></span></label></div>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('tts.read_commands')}</div><div class="settings-row-desc">${t('tts.read_commands_desc')}</div></div><label class="toggle"><input type="checkbox" ${tts.readCommands?'checked':''}><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:8px"><label>${t('tts.max_length')}</label><input class="form-input" type="number" value="${tts.maxLength}" min="10" max="500" style="width:120px"> <span style="color:var(--text-muted);font-size:12px">characters</span></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-coins"></i> ${t('tts.charge_points')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('tts.charge_desc')}</p>
            <div class="form-group"><label>${t('tts.points_per_msg')}</label><input class="form-input" type="number" value="${tts.chargePoints}" min="0" style="width:120px"></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-user-gear"></i> ${t('tts.special_users')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('tts.special_desc')}</p>
            <div id="sfTTSSpecialUsers" style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px"></div>
            <button class="btn btn-sm" id="sfAddTTSUser"><i class="fa-solid fa-plus"></i> ${t('tts.add_special')}</button>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-flask"></i> ${t('tts.voice_tester')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('tts.test_desc')}</p>
            <div class="form-group"><label>${t('tts.test_msg')}</label><input class="form-input" id="sfTTSTestMsg" value="Hello, welcome to my stream!" placeholder="Type a test message..."></div>
            <button class="btn-primary" id="sfTTSTestBtn"><i class="fa-solid fa-play"></i> ${t('tts.test_btn')}</button>
        </div>
    </div>`;
}
function initTTS() {
    const testBtn = document.getElementById('sfTTSTestBtn');
    if (testBtn) testBtn.addEventListener('click', () => {
        const msg = document.getElementById('sfTTSTestMsg')?.value || 'Hello!';
        if ('speechSynthesis' in window) {
            const u = new SpeechSynthesisUtterance(msg);
            const voice = document.getElementById('sfTTSVoice')?.value;
            if (voice) { const v = speechSynthesis.getVoices().find(v => v.name.includes(voice)); if (v) u.voice = v; }
            speechSynthesis.speak(u);
            sfToast('Playing TTS...', 'info');
        } else sfToast('Speech synthesis not supported', 'error');
    });
    const addUserBtn = document.getElementById('sfAddTTSUser');
    if (addUserBtn) addUserBtn.addEventListener('click', () => sfToast('Add special user via the allowlist above', 'info'));
}

// ═══════════════════════════════════════════
// PAGE: GOALS (v2 — server-backed with action-on-reach)
// ═══════════════════════════════════════════
let _goalsCache = [];
const GOAL_METRIC_DEFS = [
    { id:'likes',   label:'Likes',       icon:'fa-solid fa-heart',     color:'var(--pink)' },
    { id:'shares',  label:'Shares',      icon:'fa-solid fa-share',     color:'var(--blue)' },
    { id:'follows', label:'Follows',     icon:'fa-solid fa-user-plus', color:'var(--green)' },
    { id:'coins',   label:'Coins',       icon:'fa-solid fa-coins',     color:'var(--yellow)' },
    { id:'subs',    label:'Subscribers',  icon:'fa-solid fa-crown',     color:'var(--accent)' },
    { id:'gifts',   label:'Gifts',       icon:'fa-solid fa-gift',      color:'var(--accent)' },
    { id:'chat',    label:'Chat Messages',icon:'fa-solid fa-comment',   color:'var(--purple)' },
    { id:'joins',   label:'Joins',       icon:'fa-solid fa-right-to-bracket', color:'var(--green)' },
    { id:'custom',  label:'Custom',      icon:'fa-solid fa-bullseye',  color:'var(--orange)' },
];
const GOAL_STYLES = ['default','minimal','neon','gradient','retro','glassmorphism','pixel'];

async function _goalsLoad() {
    try { const r = await fetch('/api/goals?profile='+getActiveProfileId()); const d = await r.json(); _goalsCache = d.goals || []; } catch(_) { _goalsCache = []; }
}

function pageGoals() {
    return `<div class="page-header"><h1>${t('goals.title')}</h1>
        <p>${t('goals.desc')}</p>
        <div class="page-note">${t('goals.note')}</div>
    </div>
    <div class="page-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h3 style="color:var(--white);font-size:15px" id="sfGoalCount"></h3>
            <button class="btn-primary" id="sfAddGoal"><i class="fa-solid fa-plus"></i> ${t('goals.create')}</button>
        </div>
        <div id="sfGoalsList"></div>
    </div>`;
}
async function initGoals() {
    await _goalsLoad();
    _goalsRender();
    $('#sfAddGoal').addEventListener('click', () => _goalsOpenModal());
}
function _goalsRender() {
    const el = $('#sfGoalsList'); if (!el) return;
    $('#sfGoalCount').textContent = t('goals.custom', {count: _goalsCache.length});
    if (!_goalsCache.length) {
        el.innerHTML = '<div class="empty-state"><i class="fa-solid fa-bullseye"></i><h3>' + t('goals.no_goals') + '</h3><p>' + t('goals.no_goals_desc') + '</p></div>';
        return;
    }
    el.innerHTML = _goalsCache.map(g => {
        const pct = g.target > 0 ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
        const md = GOAL_METRIC_DEFS.find(m => m.id === g.metric) || GOAL_METRIC_DEFS[GOAL_METRIC_DEFS.length-1];
        const url = widgetUrl('goal', 'goalId=' + g.id + '&metric=' + g.metric, g.overlay_screen);
        const actionName = g.action_on_reach ? (_aeActions.find(a=>a.id===g.action_on_reach)?.name || '?') : '—';
        return `<div class="settings-section" style="margin-bottom:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="font-size:14px"><i class="${md.icon}" style="color:${g.color||md.color};margin-right:6px"></i> ${g.name}
                    <span style="font-size:11px;color:var(--text-muted);font-weight:400;margin-left:6px">${md.label} · Screen ${g.overlay_screen} · Style: ${g.style}</span></h3>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-sm sg-goal-inc" data-gid="${g.id}" title="+1"><i class="fa-solid fa-plus"></i></button>
                    <button class="btn btn-sm sg-goal-reset" data-gid="${g.id}" title="Reset"><i class="fa-solid fa-rotate-left"></i></button>
                    <button class="btn btn-sm sg-goal-edit" data-gid="${g.id}"><i class="fa-solid fa-pen"></i></button>
                    <button class="btn btn-sm btn-danger sg-goal-del" data-gid="${g.id}"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
            <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div><div class="progress-label">${g.current} / ${g.target} (${pct}%)</div></div>
            <div style="display:flex;gap:8px;margin-top:8px;align-items:center;flex-wrap:wrap">
                <button class="btn btn-purple btn-sm copy-url-btn" data-url="${url}"><i class="fa-regular fa-copy"></i> ${t('common.copy_url')}</button>
                <button class="btn btn-sm" onclick="window.open('${url}&preview=1','_blank','width=500,height=200')"><i class="fa-solid fa-play"></i> ${t('common.test')}</button>
                <span style="font-size:11px;color:var(--text-muted)">Auto: ${g.auto_track?'ON':'OFF'} · Action: ${actionName} · Reset: ${g.auto_reset?'Auto':'Manual'}</span>
            </div>
        </div>`;
    }).join('');
    // Bind events
    $$('.sg-goal-edit').forEach(b => b.addEventListener('click', () => _goalsOpenModal(b.dataset.gid)));
    $$('.sg-goal-del').forEach(b => b.addEventListener('click', () => {
        sfConfirm(t('goals.delete_confirm'), async () => {
            await fetch('/api/goals/'+b.dataset.gid, {method:'DELETE'});
            _goalsCache = _goalsCache.filter(x=>x.id!==b.dataset.gid);
            _goalsRender(); sfToast(t('goals.deleted'),'info');
        });
    }));
    $$('.sg-goal-inc').forEach(b => b.addEventListener('click', async () => {
        await fetch('/api/goals/'+b.dataset.gid+'/progress', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({increment:1})});
        const g = _goalsCache.find(x=>x.id===b.dataset.gid); if(g) g.current++;
        _goalsRender();
    }));
    $$('.sg-goal-reset').forEach(b => b.addEventListener('click', async () => {
        await fetch('/api/goals/'+b.dataset.gid+'/reset', {method:'POST'});
        const g = _goalsCache.find(x=>x.id===b.dataset.gid); if(g) g.current=0;
        _goalsRender();
    }));
    bindOverlayActions();
}
function _goalsOpenModal(goalId) {
    const g = goalId ? _goalsCache.find(x=>x.id===goalId) : null;
    const metricOpts = GOAL_METRIC_DEFS.map(m => `<option value="${m.id}" ${g?.metric===m.id?'selected':''}>${m.label}</option>`).join('');
    const styleOpts = GOAL_STYLES.map(s => `<option value="${s}" ${(g?.style||'default')===s?'selected':''}>${s}</option>`).join('');
    const screenOpts = [1,2,3,4,5,6,7,8].map(s => `<option value="${s}" ${(g?.overlay_screen||1)==s?'selected':''}>Screen ${s}</option>`).join('');
    const actionOpts = '<option value="">— None —</option>' + _aeActions.map(a => `<option value="${a.id}" ${g?.action_on_reach===a.id?'selected':''}>${a.name}</option>`).join('');
    const body = `
        <div class="form-group"><label>${t('goals.name')}</label><input class="form-input" id="gmName" value="${g?.name||''}" placeholder="100 Roses"></div>
        <div class="form-group"><label>${t('goals.description')}</label><input class="form-input" id="gmDesc" value="${g?.description||''}"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="form-group"><label>Metric</label><select class="form-input" id="gmMetric">${metricOpts}</select></div>
            <div class="form-group"><label>${t('goals.target')}</label><input class="form-input" type="number" id="gmTarget" value="${g?.target||100}" min="1"></div>
            <div class="form-group"><label>${t('goals.current')}</label><input class="form-input" type="number" id="gmCurrent" value="${g?.current||0}" min="0"></div>
            <div class="form-group"><label>Style</label><select class="form-input" id="gmStyle">${styleOpts}</select></div>
            <div class="form-group"><label>Color</label><input class="form-input" type="color" id="gmColor" value="${g?.color||'#8b5cf6'}"></div>
            <div class="form-group"><label>Screen</label><select class="form-input" id="gmScreen">${screenOpts}</select></div>
        </div>
        <div class="form-group"><label>Label (overlay text)</label><input class="form-input" id="gmLabel" value="${g?.label||''}" placeholder="Leave empty for auto"></div>
        <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-size:12px">Auto-track from events</div><div class="settings-row-desc">Automatically increment from TikTok events</div></div><label class="toggle"><input type="checkbox" id="gmAutoTrack" ${g?.auto_track!==false?'checked':''}><span class="toggle-slider"></span></label></div>
        <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-size:12px">${t('goals.auto_reset')}</div><div class="settings-row-desc">${t('goals.auto_reset_desc')}</div></div><label class="toggle"><input type="checkbox" id="gmAutoReset" ${g?.auto_reset?'checked':''}><span class="toggle-slider"></span></label></div>
        <div class="form-group"><label>Action on Goal Reached</label><select class="form-input" id="gmAction">${actionOpts}</select></div>`;
    sfModal(g ? t('goals.edit_goal') : t('goals.create_goal'), body, async () => {
        const data = {
            profile_id: getActiveProfileId(),
            name: $('#gmName').value || 'Goal',
            description: $('#gmDesc').value,
            metric: $('#gmMetric').value,
            target: parseInt($('#gmTarget').value) || 100,
            current: parseInt($('#gmCurrent').value) || 0,
            style: $('#gmStyle').value,
            color: $('#gmColor').value,
            overlay_screen: parseInt($('#gmScreen').value) || 1,
            label: $('#gmLabel').value,
            auto_track: $('#gmAutoTrack').checked,
            auto_reset: $('#gmAutoReset').checked,
            action_on_reach: $('#gmAction').value || null,
        };
        if (g) {
            await fetch('/api/goals/'+g.id, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
            sfToast(t('goals.updated'),'success');
        } else {
            await fetch('/api/goals', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
            sfToast(t('goals.created'),'success');
        }
        await _goalsLoad(); _goalsRender();
    }, g ? 'Update' : 'Create');
}

// ═══════════════════════════════════════════
// PAGE: GIFT OVERLAYS
// ═══════════════════════════════════════════
function pageGiftOverlays() {
    return `<div class="page-header"><h1>${t('giftov.title')}</h1><p>${t('giftov.desc')}</p></div>
    <div class="page-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h3 style="color:var(--white);font-size:15px" id="sfGiftOvCount">${t('giftov.count', {count: userGiftOverlays.length})}</h3>
            <button class="btn-primary" id="sfAddGiftOv"><i class="fa-solid fa-plus"></i> ${t('giftov.add')}</button>
        </div>
        <div id="sfGiftOvList"></div>
    </div>`;
}
function initGiftOverlays() {
    renderGiftOvList();
    $('#sfAddGiftOv').addEventListener('click', () => openGiftOvModal());
}
function renderGiftOvList() {
    $('#sfGiftOvCount').textContent = t('giftov.count', {count: userGiftOverlays.length});
    if (!userGiftOverlays.length) { $('#sfGiftOvList').innerHTML = '<div class="empty-state"><i class="fa-solid fa-gift"></i><h3>' + t('giftov.no_overlays') + '</h3><p>' + t('giftov.no_overlays_desc') + '</p></div>'; return; }
    $('#sfGiftOvList').innerHTML = userGiftOverlays.map((g, i) => `
        <div class="settings-section" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div><h3 style="font-size:14px"><i class="fa-solid fa-gift" style="color:var(--accent);margin-right:6px"></i>${g.name}</h3>
                <p style="color:var(--text-muted);font-size:12px;margin-top:4px">Style: ${g.style} · Duration: ${g.duration}s · Min Value: ${g.minValue} · Animation: ${g.animation}</p></div>
                <div style="display:flex;gap:6px"><button class="btn btn-sm sf-gov-edit" data-idx="${i}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger sf-gov-del" data-idx="${i}"><i class="fa-solid fa-trash"></i></button></div>
            </div>
        </div>`).join('');
    $$('.sf-gov-edit').forEach(b => b.addEventListener('click', () => openGiftOvModal(+b.dataset.idx)));
    $$('.sf-gov-del').forEach(b => b.addEventListener('click', () => { sfConfirm(t('giftov.delete_confirm'), () => { userGiftOverlays.splice(+b.dataset.idx, 1); sfSave('giftoverlays', userGiftOverlays); renderGiftOvList(); sfToast(t('giftov.deleted'), 'info'); }); }));
}
function openGiftOvModal(idx) {
    const g = idx !== undefined ? userGiftOverlays[idx] : null;
    const presets = OVERLAY_PRESETS.gifts || [];
    const body = `
        ${presets.length ? `<div class="form-group"><label>Load Preset</label><select class="form-input" id="govPreset"><option value="">Custom</option>${presets.map((p,i)=>`<option value="${i}">${p.name}</option>`).join('')}</select></div>` : ''}
        <div class="form-group"><label>Name</label><input class="form-input" id="govName" value="${g?.name||''}" placeholder="My Gift Alert"></div>
        <div class="form-group"><label>Style</label><select class="form-input" id="govStyle"><option ${g?.style==='classic'?'selected':''}>classic</option><option ${g?.style==='epic'?'selected':''}>epic</option><option ${g?.style==='toast'?'selected':''}>toast</option><option ${g?.style==='fullscreen'?'selected':''}>fullscreen</option></select></div>
        <div class="form-group"><label>Duration (sec)</label><input class="form-input" type="number" id="govDur" value="${g?.duration||5}" min="1" max="30"></div>
        <div class="form-group"><label>Animation</label><select class="form-input" id="govAnim"><option ${g?.animation==='slideDown'?'selected':''}>slideDown</option><option ${g?.animation==='explosion'?'selected':''}>explosion</option><option ${g?.animation==='fadeIn'?'selected':''}>fadeIn</option><option ${g?.animation==='zoom'?'selected':''}>zoom</option></select></div>
        <div class="form-group"><label>Min Gift Value</label><input class="form-input" type="number" id="govMin" value="${g?.minValue||1}" min="1"></div>`;
    const m = sfModal(g ? t('giftov.edit') : t('giftov.add'), body, () => {
        const obj = { id: g?.id || 'gov' + Date.now(), name: document.getElementById('govName').value || 'Gift Alert', style: document.getElementById('govStyle').value, duration: parseInt(document.getElementById('govDur').value) || 5, animation: document.getElementById('govAnim').value, minValue: parseInt(document.getElementById('govMin').value) || 1 };
        if (idx !== undefined) userGiftOverlays[idx] = obj; else userGiftOverlays.push(obj);
        sfSave('giftoverlays', userGiftOverlays); renderGiftOvList(); sfToast(g ? t('giftov.updated') : t('giftov.added'), 'success');
    }, g ? 'Update' : 'Add');
    if (presets.length) {
        m.querySelector('#govPreset')?.addEventListener('change', e => {
            if (e.target.value === '') return;
            const p = presets[parseInt(e.target.value)];
            m.querySelector('#govName').value = p.name;
            m.querySelector('#govStyle').value = p.style;
            m.querySelector('#govDur').value = p.duration;
            m.querySelector('#govAnim').value = p.animation;
            m.querySelector('#govMin').value = p.minValue;
        });
    }
}

// ═══════════════════════════════════════════
// PAGE: GRAPHIC OVERLAYS
// ═══════════════════════════════════════════
function pageGraphicOverlays() {
    return `<div class="page-header"><h1>${t('gfxov.title')}</h1><p>${t('gfxov.desc')}</p></div>
    <div class="page-body">
        <div class="settings-section"><h3><i class="fa-solid fa-image"></i> ${t('gfxov.title')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('gfxov.enable')}</div><div class="settings-row-desc">${t('gfxov.enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
            <h3 style="color:var(--white);font-size:15px" id="sfGfxCount">${t('gfxov.count', {count: userGraphics.length})}</h3>
            <button class="btn-primary" id="sfAddGfx"><i class="fa-solid fa-upload"></i> ${t('gfxov.upload')}</button>
        </div>
        <div id="sfGfxList"></div>
    </div>`;
}
function initGraphicOverlays() {
    renderGfxList();
    $('#sfAddGfx').addEventListener('click', () => openGfxModal());
}
function renderGfxList() {
    $('#sfGfxCount').textContent = t('gfxov.count', {count: userGraphics.length});
    if (!userGraphics.length) { $('#sfGfxList').innerHTML = '<div class="empty-state"><i class="fa-solid fa-image"></i><h3>' + t('gfxov.no_graphics') + '</h3><p>' + t('gfxov.no_graphics_desc') + '</p></div>'; return; }
    $('#sfGfxList').innerHTML = userGraphics.map((g, i) => `
        <div class="settings-section" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
                <div><h3 style="font-size:14px"><i class="fa-solid fa-image" style="color:var(--blue);margin-right:6px"></i>${g.name}</h3>
                <p style="color:var(--text-muted);font-size:12px;margin-top:4px">URL: ${g.url} · Position: ${g.position} · Size: ${g.width}x${g.height}</p></div>
                <div style="display:flex;gap:6px"><button class="btn btn-sm sf-gfx-edit" data-idx="${i}"><i class="fa-solid fa-pen"></i></button><button class="btn btn-sm btn-danger sf-gfx-del" data-idx="${i}"><i class="fa-solid fa-trash"></i></button></div>
            </div>
        </div>`).join('');
    $$('.sf-gfx-edit').forEach(b => b.addEventListener('click', () => openGfxModal(+b.dataset.idx)));
    $$('.sf-gfx-del').forEach(b => b.addEventListener('click', () => { sfConfirm(t('gfxov.delete_confirm'), () => { userGraphics.splice(+b.dataset.idx, 1); sfSave('graphics', userGraphics); renderGfxList(); sfToast(t('gfxov.deleted'), 'info'); }); }));
}
function openGfxModal(idx) {
    const g = idx !== undefined ? userGraphics[idx] : null;
    const body = `
        <div class="form-group"><label>Name</label><input class="form-input" id="gfxName" value="${g?.name||''}" placeholder="My Logo"></div>
        <div class="form-group"><label>Image URL</label><input class="form-input" id="gfxUrl" value="${g?.url||''}" placeholder="https://example.com/image.png"></div>
        <div class="form-group"><label>Position</label><select class="form-input" id="gfxPos"><option ${g?.position==='top-left'?'selected':''}>top-left</option><option ${g?.position==='top-right'?'selected':''}>top-right</option><option ${g?.position==='bottom-left'?'selected':''}>bottom-left</option><option ${g?.position==='bottom-right'?'selected':''}>bottom-right</option><option ${g?.position==='center'?'selected':''}>center</option></select></div>
        <div style="display:flex;gap:8px"><div class="form-group" style="flex:1"><label>Width (px)</label><input class="form-input" type="number" id="gfxW" value="${g?.width||200}" min="10"></div>
        <div class="form-group" style="flex:1"><label>Height (px)</label><input class="form-input" type="number" id="gfxH" value="${g?.height||200}" min="10"></div></div>`;
    sfModal(g ? t('gfxov.edit') : t('gfxov.upload'), body, () => {
        const obj = { id: g?.id || 'gfx' + Date.now(), name: document.getElementById('gfxName').value || 'Graphic', url: document.getElementById('gfxUrl').value, position: document.getElementById('gfxPos').value, width: parseInt(document.getElementById('gfxW').value) || 200, height: parseInt(document.getElementById('gfxH').value) || 200 };
        if (idx !== undefined) userGraphics[idx] = obj; else userGraphics.push(obj);
        sfSave('graphics', userGraphics); renderGfxList(); sfToast(g ? t('gfxov.updated') : t('gfxov.added'), 'success');
    }, g ? 'Update' : 'Add');
}

// ═══════════════════════════════════════════
// PAGE: TIMER
// ═══════════════════════════════════════════
let _actionTimersCache = [];
async function _atLoad() {
    try { const r = await fetch('/api/action-timers?profile='+getActiveProfileId()); const d = await r.json(); _actionTimersCache = d.timers || []; } catch(_) { _actionTimersCache = []; }
}
function pageTimer() {
    return `<div class="page-header"><h1>${t('timer.title')}</h1><p>${t('timer.desc')}</p></div>
    <div class="page-body">
        <div class="settings-section"><h3><i class="fa-solid fa-stopwatch"></i> ${t('timer.settings')}</h3>
            <div class="form-group"><label>${t('timer.duration')}</label><input class="form-input" type="number" id="sfTimerMin" value="${Math.floor(timerState.total/60)}" min="1"></div>
            <div class="form-group"><label>${t('timer.label')}</label><input class="form-input" type="text" id="sfTimerLabel" value="${timerState.label||''}" placeholder="${t('timer.label_placeholder')}"></div>
            <div style="text-align:center;margin:16px 0"><div style="font-size:48px;font-weight:700;font-family:monospace;color:var(--accent)" id="sfTimerDisplay">${formatTime(timerState.remaining)}</div></div>
            <div style="display:flex;gap:8px;justify-content:center">
                <button class="btn-primary" id="sfTimerStart"><i class="fa-solid fa-play"></i> Start</button>
                <button class="btn" id="sfTimerPause"><i class="fa-solid fa-pause"></i> Pause</button>
                <button class="btn btn-danger" id="sfTimerReset"><i class="fa-solid fa-rotate-left"></i> Reset</button>
            </div>
        </div>
        <div class="settings-section" style="margin-top:20px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                <h3><i class="fa-solid fa-clock-rotate-left"></i> Action Timers</h3>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-sm btn-primary" id="sfATAdd"><i class="fa-solid fa-plus"></i> Add</button>
                    <button class="btn btn-sm" id="sfATStartAll" title="Start all timers"><i class="fa-solid fa-play"></i> Start All</button>
                    <button class="btn btn-sm btn-danger" id="sfATStopAll" title="Stop all timers"><i class="fa-solid fa-stop"></i> Stop All</button>
                </div>
            </div>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">Automatically execute actions at regular intervals while connected to TikTok LIVE.</p>
            <div id="sfATList"></div>
        </div>
    </div>`;
}
function formatTime(s) { const m = Math.floor(s/60); const sec = s%60; return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; }
async function initTimer() {
    function updateDisplay() { const d = document.getElementById('sfTimerDisplay'); if (d) d.textContent = formatTime(timerState.remaining); }
    updateDisplay();
    $('#sfTimerStart').addEventListener('click', () => {
        if (timerState.running) return;
        if (!timerState.paused) { timerState.total = parseInt($('#sfTimerMin').value) * 60 || 300; timerState.remaining = timerState.total; timerState.label = $('#sfTimerLabel').value; }
        timerState.running = true; timerState.paused = false;
        timerState.interval = setInterval(() => {
            timerState.remaining--; updateDisplay();
            if (timerState.remaining <= 0) { clearInterval(timerState.interval); timerState.running = false; sfToast(t('timer.finished'), 'success'); }
        }, 1000);
        sfToast(t('timer.started'), 'info');
    });
    $('#sfTimerPause').addEventListener('click', () => {
        if (!timerState.running) return;
        clearInterval(timerState.interval); timerState.running = false; timerState.paused = true;
        sfToast(t('timer.paused'), 'info');
    });
    $('#sfTimerReset').addEventListener('click', () => {
        clearInterval(timerState.interval); timerState.running = false; timerState.paused = false;
        timerState.seconds = parseInt($('#sfTimerMin').value) * 60 || 300; timerState.remaining = timerState.seconds;
        updateDisplay(); sfToast(t('timer.reset'), 'info');
    });

    // Action Timers
    await _atLoad();
    _atRender();
    $('#sfATAdd').addEventListener('click', () => _atOpenModal());
    $('#sfATStartAll').addEventListener('click', async () => {
        await fetch('/api/action-timers/start', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({profile_id:getActiveProfileId(),is_live:true})});
        sfToast('Action timers started','success');
    });
    $('#sfATStopAll').addEventListener('click', async () => {
        await fetch('/api/action-timers/stop', {method:'POST'});
        sfToast('Action timers stopped','info');
    });
}
function _atRender() {
    const el = $('#sfATList'); if (!el) return;
    if (!_actionTimersCache.length) {
        el.innerHTML = '<div class="empty-state" style="padding:20px"><i class="fa-solid fa-clock-rotate-left"></i><h3>No Action Timers</h3><p>Create a timer to automatically execute actions at intervals.</p></div>';
        return;
    }
    el.innerHTML = _actionTimersCache.map(t => {
        const actionName = _aeActions.find(a=>a.id===t.action_id)?.name || '?';
        const mins = Math.floor(t.interval_seconds/60);
        const secs = t.interval_seconds%60;
        const interval = mins > 0 ? (secs > 0 ? `${mins}m ${secs}s` : `${mins}m`) : `${secs}s`;
        return `<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--surface);border-radius:8px;margin-bottom:8px">
            <div style="flex:1">
                <strong style="font-size:13px">${t.name}</strong>
                <span style="color:var(--text-muted);font-size:11px;margin-left:8px">Every ${interval} → ${actionName}</span>
                ${t.jitter_seconds>0?'<span style="color:var(--text-dim);font-size:10px;margin-left:4px">(±'+t.jitter_seconds+'s jitter)</span>':''}
                ${t.only_when_live?'<span style="color:var(--yellow);font-size:10px;margin-left:4px">LIVE only</span>':''}
            </div>
            <label class="toggle" style="margin:0"><input type="checkbox" ${t.enabled?'checked':''} class="at-toggle" data-tid="${t.id}"><span class="toggle-slider"></span></label>
            <button class="btn btn-sm at-edit" data-tid="${t.id}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger at-del" data-tid="${t.id}"><i class="fa-solid fa-trash"></i></button>
        </div>`;
    }).join('');
    $$('.at-toggle').forEach(cb => cb.addEventListener('change', async () => {
        await fetch('/api/action-timers/'+cb.dataset.tid, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({enabled:cb.checked})});
        const t = _actionTimersCache.find(x=>x.id===cb.dataset.tid); if(t) t.enabled=cb.checked;
    }));
    $$('.at-edit').forEach(b => b.addEventListener('click', () => _atOpenModal(b.dataset.tid)));
    $$('.at-del').forEach(b => b.addEventListener('click', () => {
        sfConfirm('Delete this action timer?', async () => {
            await fetch('/api/action-timers/'+b.dataset.tid, {method:'DELETE'});
            _actionTimersCache = _actionTimersCache.filter(x=>x.id!==b.dataset.tid);
            _atRender(); sfToast('Timer deleted','info');
        });
    }));
}
function _atOpenModal(timerId) {
    const t = timerId ? _actionTimersCache.find(x=>x.id===timerId) : null;
    const actionOpts = '<option value="">— Select Action —</option>' + _aeActions.map(a => `<option value="${a.id}" ${t?.action_id===a.id?'selected':''}>${a.name}</option>`).join('');
    const body = `
        <div class="form-group"><label>Name</label><input class="form-input" id="atName" value="${t?.name||''}" placeholder="Reminder Timer"></div>
        <div class="form-group"><label>Action to Execute</label><select class="form-input" id="atAction">${actionOpts}</select></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            <div class="form-group"><label>Interval (seconds)</label><input class="form-input" type="number" id="atInterval" value="${t?.interval_seconds||300}" min="10"></div>
            <div class="form-group"><label>Jitter ±(seconds)</label><input class="form-input" type="number" id="atJitter" value="${t?.jitter_seconds||0}" min="0"></div>
        </div>
        <div class="settings-row" style="padding:6px 0"><div class="settings-row-info"><div class="settings-row-label" style="font-size:12px">Only when LIVE</div><div class="settings-row-desc">Timer only runs while connected to TikTok LIVE</div></div><label class="toggle"><input type="checkbox" id="atLiveOnly" ${t?.only_when_live!==false?'checked':''}><span class="toggle-slider"></span></label></div>`;
    sfModal(t ? 'Edit Action Timer' : 'Create Action Timer', body, async () => {
        const actionId = $('#atAction').value;
        if (!actionId) { sfToast('Select an action','error'); return; }
        const data = {
            profile_id: getActiveProfileId(),
            name: $('#atName').value || 'Timer',
            action_id: actionId,
            interval_seconds: parseInt($('#atInterval').value) || 300,
            jitter_seconds: parseInt($('#atJitter').value) || 0,
            only_when_live: $('#atLiveOnly').checked,
        };
        if (t) {
            await fetch('/api/action-timers/'+t.id, {method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
            sfToast('Timer updated','success');
        } else {
            await fetch('/api/action-timers', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
            sfToast('Timer created','success');
        }
        await _atLoad(); _atRender();
    }, t ? 'Update' : 'Create');
}

// ═══════════════════════════════════════════
// PAGE: SPIN WHEEL
// ═══════════════════════════════════════════
function pageWheel() {
    return `<div class="page-header"><h1>${t('wheel.title')}</h1><p>${t('wheel.desc')}</p></div>
    <div class="page-body"><div class="settings-section"><h3><i class="fa-solid fa-circle-notch"></i> ${t('wheel.segments')}</h3>
        <p style="color:var(--text-dim);font-size:13px;margin-bottom:16px">${t('wheel.segments_desc')}</p>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="color:var(--white);font-size:13px;font-weight:600" id="sfWheelCount">${t('wheel.count', {count: userWheelSegments.length})}</span>
            <button class="btn-primary btn-sm" id="sfAddSeg"><i class="fa-solid fa-plus"></i> ${t('wheel.add')}</button>
        </div>
        <div id="sfWheelList"></div>
    </div></div>`;
}
function initWheel() {
    renderWheelList();
    $('#sfAddSeg').addEventListener('click', () => openSegModal());
}
function renderWheelList() {
    $('#sfWheelCount').textContent = t('wheel.count', {count: userWheelSegments.length});
    if (!userWheelSegments.length) { $('#sfWheelList').innerHTML = '<div class="empty-state"><i class="fa-solid fa-circle-notch"></i><h3>' + t('wheel.no_segments') + '</h3><p>' + t('wheel.no_segments_desc') + '</p></div>'; return; }
    $('#sfWheelList').innerHTML = userWheelSegments.map((s, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:var(--surface);border-radius:6px;margin-bottom:6px">
            <div style="width:20px;height:20px;border-radius:50%;background:${s.color};flex-shrink:0"></div>
            <div style="flex:1"><strong style="font-size:13px">${s.label}</strong><span style="color:var(--text-muted);font-size:11px;margin-left:8px">Weight: ${s.weight}</span></div>
            <button class="btn btn-sm sf-seg-edit" data-idx="${i}"><i class="fa-solid fa-pen"></i></button>
            <button class="btn btn-sm btn-danger sf-seg-del" data-idx="${i}"><i class="fa-solid fa-trash"></i></button>
        </div>`).join('');
    $$('.sf-seg-edit').forEach(b => b.addEventListener('click', () => openSegModal(+b.dataset.idx)));
    $$('.sf-seg-del').forEach(b => b.addEventListener('click', () => { sfConfirm(t('wheel.delete_confirm'), () => { userWheelSegments.splice(+b.dataset.idx, 1); sfSave('wheel_segments', userWheelSegments); renderWheelList(); sfToast(t('wheel.deleted'), 'info'); }); }));
}
function openSegModal(idx) {
    const s = idx !== undefined ? userWheelSegments[idx] : null;
    const body = `
        <div class="form-group"><label>${t('wheel.label')}</label><input class="form-input" id="segLabel" value="${s?.label||''}" placeholder="Prize Name"></div>
        <div class="form-group"><label>${t('wheel.color')}</label><input type="color" id="segColor" value="${s?.color||'#8b5cf6'}" style="width:60px;height:32px;border:none;cursor:pointer"></div>
        <div class="form-group"><label>${t('wheel.weight')}</label><input class="form-input" type="number" id="segWeight" value="${s?.weight||1}" min="1" max="100"></div>`;
    sfModal(s ? t('wheel.edit') : t('wheel.add'), body, () => {
        const obj = { label: document.getElementById('segLabel').value || 'Prize', color: document.getElementById('segColor').value, weight: parseInt(document.getElementById('segWeight').value) || 1 };
        if (idx !== undefined) userWheelSegments[idx] = obj; else userWheelSegments.push(obj);
        sfSave('wheel_segments', userWheelSegments); renderWheelList(); sfToast(s ? t('wheel.updated') : t('wheel.added'), 'success');
    }, s ? 'Update' : 'Add');
}

// ═══════════════════════════════════════════
// PAGE: COIN DROP
// ═══════════════════════════════════════════
function pageCoinDrop() {
    return `<div class="page-header"><h1>${t('coindrop.title')}</h1><p>${t('coindrop.desc')}</p></div>
    <div class="page-body"><div class="settings-section"><h3><i class="fa-solid fa-coins"></i> ${t('coindrop.title')}</h3>
        <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('coindrop.enable')}</div><div class="settings-row-desc">${t('coindrop.enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
        <div class="form-group" style="margin-top:12px"><label>${t('coindrop.style')}</label><select class="form-select"><option>${t('coindrop.gold')}</option><option>${t('coindrop.tiktok')}</option><option>${t('coindrop.custom')}</option></select></div>
        <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('coindrop.intensity')}</div></div><input type="range" min="1" max="10" value="5" style="width:120px;accent-color:var(--accent)"></div>
    </div></div>`;
}

// ═══════════════════════════════════════════
// PAGE: CHAT COMMANDS
// ═══════════════════════════════════════════
function pageChatCommands() {
    const builtIn = [
        { cmd:'!help', desc:t('cmd.help'), enabled:true },
        { cmd:'!score', desc:t('cmd.score'), enabled:true },
        { cmd:'!send @user amount', desc:t('cmd.send'), enabled:true },
        { cmd:'!spin', desc:t('cmd.spin'), enabled:true },
        { cmd:'!get', desc:t('cmd.get'), enabled:true },
        { cmd:'!play song', desc:t('cmd.play'), enabled:false },
        { cmd:'!skip', desc:t('cmd.skip'), enabled:false },
        { cmd:'!commands', desc:t('cmd.commands'), enabled:true },
    ];
    const builtInRows = builtIn.map(b => `
        <div class="settings-row" style="padding:6px 0">
            <div class="settings-row-info">
                <div class="settings-row-label" style="font-family:monospace;color:var(--accent)">${b.cmd}</div>
                <div class="settings-row-desc">${b.desc}</div>
            </div>
            <label class="toggle"><input type="checkbox" ${b.enabled?'checked':''}><span class="toggle-slider"></span></label>
        </div>`).join('');
    return `
    <div class="page-header"><h1>${t('chatcmd.title')}</h1>
        <p>${t('chatcmd.desc')}</p>
    </div>
    <div class="page-body">
        <div class="settings-section">
            <h3><i class="fa-solid fa-terminal"></i> ${t('chatcmd.builtin')}</h3>
            <p style="color:var(--text-dim);font-size:12px;margin-bottom:12px">${t('chatcmd.builtin_desc')}</p>
            ${builtInRows}
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin:24px 0 16px">
            <h3 style="color:var(--white);font-size:15px" id="sfChatCmdCount">${t('chatcmd.custom', {count: userCommands.length})}</h3>
            <button class="btn-primary" id="sfAddChatCmd"><i class="fa-solid fa-plus"></i> ${t('chatcmd.add')}</button>
        </div>
        <div id="sfChatCmdList" style="display:flex;flex-direction:column;gap:8px"></div>
    </div>`;
}
function initChatCommands() {
    renderChatCmdList();
    $('#sfAddChatCmd').addEventListener('click', () => openCmdModal());
}
function renderChatCmdList() {
    $('#sfChatCmdCount').textContent = t('chatcmd.custom', {count: userCommands.length});
    $('#sfChatCmdList').innerHTML = userCommands.map((c, i) => `
        <div class="cmd-item">
            <div class="cmd-prefix">${c.cmd}</div>
            <div class="cmd-info"><div class="cmd-name">${c.cmd}</div><div class="cmd-response">${c.response}</div></div>
            <div style="display:flex;gap:6px;align-items:center"><span style="color:var(--text-muted);font-size:11px">${c.cooldown}s</span>
                <button class="btn btn-sm sf-ccmd-edit" data-idx="${i}"><i class="fa-solid fa-pen"></i></button>
                <button class="btn btn-sm btn-danger sf-ccmd-del" data-idx="${i}"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>`).join('');
    $$('.sf-ccmd-edit').forEach(b => b.addEventListener('click', () => openCmdModal(+b.dataset.idx)));
    $$('.sf-ccmd-del').forEach(b => b.addEventListener('click', () => { sfConfirm(t('chatcmd.delete_confirm'), () => { userCommands.splice(+b.dataset.idx, 1); sfSave('commands', userCommands); renderChatCmdList(); sfToast(t('chatcmd.deleted'), 'info'); }); }));
}

function pageLastX() {
    const lastXTypes = [
        { id:'follower',   label:t('lastx.follower'),    icon:'fa-solid fa-user-plus', color:'var(--green)' },
        { id:'gifter',     label:t('lastx.gifter'),      icon:'fa-solid fa-gift',      color:'var(--accent)' },
        { id:'subscriber', label:t('lastx.subscriber'),  icon:'fa-solid fa-crown',     color:'var(--yellow)' },
        { id:'sharer',     label:t('lastx.sharer'),      icon:'fa-solid fa-share',     color:'var(--blue)' },
        { id:'liker',      label:t('lastx.liker'),       icon:'fa-solid fa-heart',     color:'var(--pink)' },
    ];
    const cards = lastXTypes.map(lx => {
        const url = widgetUrl('lastx', 'x=' + lx.id);
        return `<div class="settings-section" style="margin-bottom:16px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="font-size:14px"><i class="${lx.icon}" style="color:${lx.color};margin-right:6px"></i> ${lx.label}</h3>
                <button class="btn btn-sm" onclick="window.open('${url}&preview=1','_blank','width=400,height=150')"><i class="fa-solid fa-play"></i> ${t('common.test')}</button>
            </div>
            <div style="display:flex;gap:8px;align-items:center">
                <button class="btn btn-purple btn-sm copy-url-btn" data-url="${url}"><i class="fa-regular fa-copy"></i> ${t('common.copy_url')}</button>
                <button class="btn btn-sm customize-overlay-btn" data-oid="lastx"><i class="fa-solid fa-gear"></i> ${t('common.customize')}</button>
                <div class="card-url-text" style="flex:1;font-size:11px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${url}">${url}</div>
            </div>
        </div>`;
    }).join('');

    const gcounterUrl = widgetUrl('gcounter');
    return `
    <div class="page-header"><h1>${t('lastx.title')}</h1>
        <p>${t('lastx.desc')}</p>
        <div class="page-note">${t('lastx.note')}</div>
    </div>
    <div class="page-body">
        ${cards}
        <div class="settings-section" style="margin-top:24px">
            <h3><i class="fa-solid fa-hashtag" style="color:var(--yellow);margin-right:6px"></i> ${t('lastx.gift_counter')}</h3>
            <p style="color:var(--text-muted);font-size:12px;margin-bottom:12px">${t('lastx.gift_counter_desc')}</p>
            <div style="display:flex;gap:8px;align-items:center">
                <button class="btn btn-purple btn-sm copy-url-btn" data-url="${gcounterUrl}"><i class="fa-regular fa-copy"></i> ${t('common.copy_url')}</button>
                <button class="btn btn-sm" onclick="window.open('${gcounterUrl}?preview=1','_blank','width=300,height=200')"><i class="fa-solid fa-play"></i> ${t('common.test')}</button>
                <button class="btn btn-sm customize-overlay-btn" data-oid="gcounter"><i class="fa-solid fa-gear"></i> ${t('common.customize')}</button>
                <div class="card-url-text" style="flex:1;font-size:11px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${gcounterUrl}">${gcounterUrl}</div>
            </div>
        </div>
    </div>`;
}

function pageOBSDocks() {
    const docks = [
        { name:'Activity Feed — Dock 1', url:'/widget/activity-feed?did=1', desc:'Live activity feed showing all stream events. Use as an OBS browser dock for real-time monitoring.', icon:'fa-solid fa-rss' },
        { name:'Activity Feed — Dock 2', url:'/widget/activity-feed?did=2', desc:'Second activity feed dock — use for a different screen or monitor.', icon:'fa-solid fa-rss' },
        { name:'Chat Dock', url:'/widget/chat', desc:'Live chat feed for OBS browser dock — see all chat messages.', icon:'fa-solid fa-comments' },
        { name:'Gift Feed Dock', url:'/widget/gifts', desc:'Gift and event notifications dock — monitor gifts in real-time.', icon:'fa-solid fa-gift' },
        { name:'Viewer Count Dock', url:'/widget/viewercount', desc:'Current viewer count as a compact dock panel.', icon:'fa-solid fa-eye' },
        { name:'Song Queue Dock', url:'/widget/songrequests', desc:'Current song and request queue from Spotify.', icon:'fa-brands fa-spotify' },
    ];
    const items = docks.map(d => {
        const parts = d.url.replace('/widget/','').split('?');
        const fullUrl = widgetUrl(parts[0], parts[1] || '');
        return `<div class="settings-section" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                <h3 style="font-size:14px"><i class="${d.icon}" style="color:var(--accent);margin-right:6px"></i> ${d.name}</h3>
                <button class="btn btn-sm" onclick="window.open('${fullUrl}','_blank','width=400,height=600')"><i class="fa-solid fa-play"></i> Test</button>
            </div>
            <p style="color:var(--text-muted);font-size:12px;margin-bottom:8px">${d.desc}</p>
            <div style="display:flex;gap:8px;align-items:center">
                <button class="btn btn-purple btn-sm copy-url-btn" data-url="${fullUrl}"><i class="fa-regular fa-copy"></i> ${t('common.copy_url')}</button>
                <div class="card-url-text" style="flex:1;font-size:11px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${fullUrl}">${fullUrl}</div>
            </div>
        </div>`;
    }).join('');
    return `
    <div class="page-header"><h1>${t('obsdocks.title')}</h1>
        <p>${t('obsdocks.desc')}</p>
        <div class="page-note">${t('obsdocks.note')}</div>
    </div>
    <div class="page-body">${items}</div>`;
}

// ═══════════════════════════════════════════
// PAGE: GIFT BROWSER
// ═══════════════════════════════════════════
const TIKTOK_GIFTS = [
    { id:1, name:'Rose', coins:1, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:2, name:'Sticker', coins:1, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.png' },
    { id:3, name:'Heart Me', coins:1, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:4, name:'GG', coins:1, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:5, name:'Ice Cream Cone', coins:1, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:6, name:'Finger Heart', coins:5, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:7, name:'Doughnut', coins:30, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:8, name:'Sign Language Love', coins:49, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:9, name:'Perfume', coins:99, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:10, name:'TikTok', coins:1, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:11, name:'Confetti', coins:100, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:12, name:'Drama Queen', coins:5, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:13, name:'Sunglasses', coins:199, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:14, name:'Garland Headpiece', coins:299, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:15, name:'Cap', coins:399, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:16, name:'Hand Hearts', coins:100, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:17, name:'Cheer You Up', coins:199, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:18, name:'Corgi', coins:299, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:19, name:'Money Gun', coins:500, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:20, name:'Galaxy', coins:1000, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:21, name:'Rocket', coins:2999, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:22, name:'Lion', coins:29999, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:23, name:'Universe', coins:34999, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
    { id:24, name:'Planet', coins:15000, img:'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/7405839371498498817~tplv-obj.png' },
];
function pageGiftBrowser() {
    let giftCards = TIKTOK_GIFTS.map(g => `<div class="card" style="text-align:center;padding:16px 12px">
        <div style="font-size:32px;margin-bottom:8px"><i class="fa-solid fa-gift" style="color:var(--accent)"></i></div>
        <div style="font-weight:600;font-size:13px;color:var(--white)">${g.name}</div>
        <div style="color:var(--yellow);font-size:12px;margin-top:4px"><i class="fa-solid fa-coins"></i> ${g.coins.toLocaleString()} coins</div>
    </div>`).join('');
    return `
    <div class="page-header"><h1>${t('giftbrowser.title')}</h1>
        <p>${t('giftbrowser.desc')}</p>
    </div>
    <div class="page-body">
        <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
            <div class="input-with-icon" style="flex:1"><i class="fa-solid fa-magnifying-glass"></i><input class="form-input" type="text" id="sfGiftSearch" placeholder="${t('giftcatalog.search')}"></div>
            <select class="form-select" id="sfGiftSort" style="width:180px">
                <option value="name">${t('giftbrowser.sort_name')}</option>
                <option value="coins-asc">${t('giftbrowser.sort_coins_asc')}</option>
                <option value="coins-desc">${t('giftbrowser.sort_coins_desc')}</option>
            </select>
        </div>
        <div id="sfGiftGrid" class="card-grid" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr))">${giftCards}</div>
    </div>`;
}
function initGiftBrowser() {
    const search = document.getElementById('sfGiftSearch');
    const sort = document.getElementById('sfGiftSort');
    if (search) search.addEventListener('input', sfFilterGifts);
    if (sort) sort.addEventListener('change', sfFilterGifts);
}
function sfFilterGifts() {
    const q = (document.getElementById('sfGiftSearch').value || '').toLowerCase();
    const sortVal = document.getElementById('sfGiftSort').value || 'name';
    let filtered = TIKTOK_GIFTS.filter(g => g.name.toLowerCase().indexOf(q) >= 0);
    if (sortVal === 'coins-asc') filtered.sort((a,b) => a.coins - b.coins);
    else if (sortVal === 'coins-desc') filtered.sort((a,b) => b.coins - a.coins);
    else filtered.sort((a,b) => a.name.localeCompare(b.name));
    const el = document.getElementById('sfGiftGrid');
    if (!el) return;
    el.innerHTML = filtered.length ? filtered.map(g => '<div class="card" style="text-align:center;padding:16px 12px"><div style="font-size:32px;margin-bottom:8px"><i class="fa-solid fa-gift" style="color:var(--accent)"></i></div><div style="font-weight:600;font-size:13px;color:var(--white)">' + g.name + '</div><div style="color:var(--yellow);font-size:12px;margin-top:4px"><i class="fa-solid fa-coins"></i> ' + g.coins.toLocaleString() + ' coins</div></div>').join('') : '<div class="empty-state"><i class="fa-solid fa-magnifying-glass"></i><h3>' + t('giftbrowser.no_results') + '</h3><p>' + t('giftbrowser.no_results_desc') + '</p></div>';
}

function pageChallenge() {
    return `
    <div class="page-header"><h1>${t('challenge.title')}</h1><p>${t('challenge.desc')}</p></div>
    <div class="page-body">
        <div class="settings-section"><h3><i class="fa-solid fa-flag-checkered"></i> ${t('challenge.settings')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('challenge.enable')}</div><div class="settings-row-desc">${t('challenge.enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('challenge.name')}</label><input class="form-input" type="text" id="sfChName" value="${challengeState.name}" placeholder="${t('challenge.name_placeholder')}"></div>
            <div class="form-group"><label>${t('challenge.target')}</label><input class="form-input" type="number" id="sfChTarget" value="${challengeState.target}" min="1"></div>
            <div class="form-group"><label>${t('challenge.time_limit')}</label><input class="form-input" type="number" id="sfChTime" value="${Math.floor(challengeState.timeLimit/60)}" min="1"></div>
            <div class="form-group"><label>${t('challenge.reward')}</label><input class="form-input" type="text" id="sfChReward" value="${challengeState.reward}" placeholder="${t('challenge.reward_placeholder')}"></div>
        </div>
        <div class="settings-section"><h3><i class="fa-solid fa-chart-line"></i> ${t('challenge.progress')}</h3>
            <div class="stat-grid">
                <div class="stat-card"><div class="stat-label">${t('challenge.progress')}</div><div class="stat-value" style="color:var(--accent)" id="sfChProgress">${challengeState.current} / ${challengeState.target}</div></div>
                <div class="stat-card"><div class="stat-label">${t('challenge.time_left')}</div><div class="stat-value" id="sfChTimer">${formatTime(challengeState.remaining)}</div></div>
            </div>
            <div style="margin-top:12px"><div class="progress-bar"><div class="progress-fill" id="sfChBar" style="width:${challengeState.target>0?Math.round(challengeState.current/challengeState.target*100):0}%"></div></div></div>
        </div>
        <div style="display:flex;gap:8px"><button class="btn-primary" id="sfChStart"><i class="fa-solid fa-play"></i> ${t('challenge.start')}</button><button class="btn" id="sfChReset"><i class="fa-solid fa-rotate-left"></i> ${t('common.reset')}</button></div>
    </div>`;
}
function initChallenge() {
    function updateChUI() {
        const p = document.getElementById('sfChProgress'); if (p) p.textContent = `${challengeState.current} / ${challengeState.target}`;
        const t = document.getElementById('sfChTimer'); if (t) t.textContent = formatTime(challengeState.remaining);
        const b = document.getElementById('sfChBar'); if (b) b.style.width = (challengeState.target>0?Math.round(challengeState.current/challengeState.target*100):0)+'%';
    }
    updateChUI();
    $('#sfChStart').addEventListener('click', () => {
        if (challengeState.running) return;
        challengeState.name = $('#sfChName').value; challengeState.target = parseInt($('#sfChTarget').value)||100;
        challengeState.timeLimit = (parseInt($('#sfChTime').value)||10)*60; challengeState.reward = $('#sfChReward').value;
        challengeState.remaining = challengeState.timeLimit; challengeState.current = 0; challengeState.running = true;
        challengeState.interval = setInterval(() => {
            challengeState.remaining--; updateChUI();
            if (challengeState.remaining <= 0) { clearInterval(challengeState.interval); challengeState.running = false; sfToast(t('challenge.time_up'), 'info'); }
        }, 1000);
        sfToast(t('challenge.started'), 'success');
    });
    $('#sfChReset').addEventListener('click', () => {
        clearInterval(challengeState.interval); challengeState.running = false;
        challengeState.current = 0; challengeState.remaining = challengeState.timeLimit;
        updateChUI(); sfToast(t('challenge.reset_done'), 'info');
    });
}

function pageHalving() {
    return `
    <div class="page-header"><h1>${t('halving.title')}</h1><p>${t('halving.desc')}</p></div>
    <div class="page-body">
        <div class="settings-section"><h3><i class="fa-solid fa-scissors"></i> ${t('halving.settings')}</h3>
            <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('halving.enable')}</div><div class="settings-row-desc">${t('halving.enable_desc')}</div></div><label class="toggle"><input type="checkbox" checked><span class="toggle-slider"></span></label></div>
            <div class="form-group" style="margin-top:12px"><label>${t('halving.start_value')}</label><input class="form-input" type="number" id="sfHalvStartVal" value="${halvingState.startValue}" min="10"></div>
            <div class="form-group"><label>${t('halving.trigger')}</label><select class="form-select" id="sfHalvTrigger"><option>Any Gift</option><option>Rose</option><option>Drama Queen</option><option>Lion</option><option>Universe</option></select></div>
            <div class="form-group"><label>${t('halving.min_value')}</label><input class="form-input" type="number" id="sfHalvMin" value="1" min="1"></div>
        </div>
        <div class="settings-section"><h3><i class="fa-solid fa-chart-line"></i> ${t('halving.current_state')}</h3>
            <div class="stat-grid">
                <div class="stat-card"><div class="stat-label">${t('halving.current_value')}</div><div class="stat-value" style="color:var(--accent)" id="sfHalvValue">${halvingState.value.toLocaleString()}</div></div>
                <div class="stat-card"><div class="stat-label">${t('halving.halvings')}</div><div class="stat-value" id="sfHalvCount">${halvingState.halvings}</div></div>
            </div>
            <div style="display:flex;gap:8px;margin-top:12px">
                <button class="btn-primary" id="sfHalvStart"><i class="fa-solid fa-play"></i> ${t('common.start')}</button>
                <button class="btn" id="sfHalvHalve"><i class="fa-solid fa-scissors"></i> ${t('halving.halve_now')}</button>
                <button class="btn btn-danger" id="sfHalvReset"><i class="fa-solid fa-rotate-left"></i> ${t('common.reset')}</button>
            </div>
        </div>
    </div>`;
}
function initHalving() {
    function updateHUI() {
        const v = document.getElementById('sfHalvValue'); if (v) v.textContent = halvingState.value.toLocaleString();
        const c = document.getElementById('sfHalvCount'); if (c) c.textContent = halvingState.halvings;
    }
    updateHUI();
    $('#sfHalvStart').addEventListener('click', () => {
        halvingState.startValue = parseInt($('#sfHalvStartVal').value) || 1000;
        halvingState.value = halvingState.startValue; halvingState.halvings = 0; halvingState.running = true;
        updateHUI(); sfToast(t('halving.started'), 'success');
    });
    $('#sfHalvHalve').addEventListener('click', () => {
        if (!halvingState.running) { sfToast(t('halving.start_first'), 'info'); return; }
        const minVal = parseInt(document.getElementById('sfHalvMin')?.value) || 1;
        halvingState.value = Math.max(minVal, Math.floor(halvingState.value / 2));
        halvingState.halvings++;
        updateHUI(); sfToast(t('halving.halved', {value: halvingState.value}), 'success');
    });
    $('#sfHalvReset').addEventListener('click', () => {
        halvingState.value = halvingState.startValue; halvingState.halvings = 0; halvingState.running = false;
        updateHUI(); sfToast(t('halving.reset_done'), 'info');
    });
}

// ── Song Requests (Spotify) ──
function initSongRequests() {
    const cid = getActiveProfile()?.channelId || 'default';
    // Check Spotify connection status
    fetch('/api/spotify/status?cid=' + cid).then(r => r.json()).then(data => {
        const statusEl = document.querySelector('#sfSpotifyStatus');
        if (!statusEl) return;
        if (data.connected) {
            statusEl.innerHTML = `<div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('songs.spotify_status')}</div><div class="settings-row-desc" style="color:var(--green)">✅ ${t('spotify.connected_as', {name: data.profile?.name || 'Unknown'})}</div></div><button class="btn btn-sm btn-danger" id="sfSpotifyDisconnect"><i class="fa-solid fa-unlink"></i> ${t('topbar.disconnect')}</button></div>`;
            $('#sfSpotifyDisconnect')?.addEventListener('click', async () => {
                await fetch('/api/spotify/disconnect', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cid }) });
                sfToast(t('spotify.disconnected'), 'info');
                navigateTo('songrequests');
            });
            // Load now playing
            loadNowPlaying(cid);
            // Load queue
            loadSpotifyQueue(cid);
        } else {
            statusEl.innerHTML = `<div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">${t('songs.spotify_status')}</div><div class="settings-row-desc">${t('spotify.not_connected')}</div></div><button class="btn btn-sm" id="sfSpotifyConnect"><i class="fa-brands fa-spotify" style="color:#1DB954"></i> ${t('spotify.connect')}</button></div>`;
            $('#sfSpotifyConnect')?.addEventListener('click', () => {
                window.open('/api/spotify/auth?cid=' + cid, 'spotify_auth', 'width=500,height=700');
            });
        }
    }).catch(() => {});

    // Search functionality
    const searchInput = $('#sfSRTestSong');
    const searchBtn = $('#sfSRTestBtn');
    if (searchInput && searchBtn) {
        searchBtn.textContent = ''; searchBtn.innerHTML = '<i class="fa-solid fa-search"></i> ' + t('songs.search_btn');
        searchBtn.addEventListener('click', async () => {
            const q = searchInput.value.trim();
            if (!q) return;
            try {
                const data = await fetch('/api/spotify/search?cid=' + cid + '&q=' + encodeURIComponent(q)).then(r => r.json());
                const resultsEl = $('#sfSRResults');
                if (!resultsEl) return;
                if (!data.tracks?.length) { resultsEl.innerHTML = '<div style="color:var(--text-muted);padding:12px">' + t('common.no_results') + '</div>'; return; }
                resultsEl.innerHTML = data.tracks.map(t => `
                    <div class="song-item" style="cursor:pointer" data-uri="${t.uri}" data-title="${t.title}" data-artist="${t.artist}">
                        ${t.albumArt ? `<img src="${t.albumArt}" style="width:40px;height:40px;border-radius:6px;object-fit:cover">` : '<div class="song-cover"><i class="fa-brands fa-spotify"></i></div>'}
                        <div class="song-info"><div class="song-title">${t.title}</div><div class="song-artist">${t.artist}</div></div>
                        <button class="btn btn-sm btn-primary sf-add-queue"><i class="fa-solid fa-plus"></i> Queue</button>
                    </div>`).join('');
                $$('.sf-add-queue').forEach(btn => btn.addEventListener('click', async (e) => {
                    const item = e.target.closest('.song-item');
                    try {
                        await fetch('/api/spotify/queue/add', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cid, uri: item.dataset.uri, title: item.dataset.title, artist: item.dataset.artist, requester: 'Streamer' }) });
                        sfToast(t('spotify.added_to_queue', {title: item.dataset.title}), 'success');
                        loadSpotifyQueue(cid);
                    } catch (err) { sfToast('Failed: ' + err.message, 'error'); }
                }));
            } catch (err) { sfToast('Search failed: ' + err.message, 'error'); }
        });
        searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') searchBtn.click(); });
    }

    // Skip / Pause / Resume buttons
    $('#sfSpotifySkip')?.addEventListener('click', async () => {
        try { await fetch('/api/spotify/skip', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cid }) }); sfToast(t('spotify.skipped'), 'info'); setTimeout(() => loadNowPlaying(cid), 1000); } catch (_) {}
    });
    $('#sfSpotifyPause')?.addEventListener('click', async () => {
        try { await fetch('/api/spotify/pause', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cid }) }); sfToast(t('spotify.paused'), 'info'); } catch (_) {}
    });
    $('#sfSpotifyResume')?.addEventListener('click', async () => {
        try { await fetch('/api/spotify/resume', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cid }) }); sfToast(t('spotify.resumed'), 'info'); } catch (_) {}
    });
}

async function loadNowPlaying(cid) {
    try {
        const data = await fetch('/api/spotify/now-playing?cid=' + cid).then(r => r.json());
        const el = $('#sfNowPlaying');
        if (!el) return;
        if (!data.playing && !data.title) { el.innerHTML = '<div style="color:var(--text-muted);padding:12px">' + t('spotify.nothing_playing') + '</div>'; return; }
        const pct = data.duration ? Math.round((data.progress / data.duration) * 100) : 0;
        el.innerHTML = `
            <div class="song-item" style="border:1px solid rgba(29,185,84,.2)">
                ${data.albumArt ? `<img src="${data.albumArt}" style="width:48px;height:48px;border-radius:8px;object-fit:cover">` : '<div class="song-cover"><i class="fa-brands fa-spotify"></i></div>'}
                <div class="song-info"><div class="song-title">${data.title}</div><div class="song-artist">${data.artist}</div>
                    <div style="height:3px;background:rgba(255,255,255,.08);border-radius:2px;margin-top:6px;overflow:hidden"><div style="height:100%;width:${pct}%;background:#1DB954;border-radius:2px"></div></div>
                </div>
                <div style="display:flex;gap:6px">
                    <button class="btn btn-sm" id="sfSpotifyPause"><i class="fa-solid fa-pause"></i></button>
                    <button class="btn btn-sm" id="sfSpotifyResume"><i class="fa-solid fa-play"></i></button>
                    <button class="btn btn-sm" id="sfSpotifySkip"><i class="fa-solid fa-forward"></i></button>
                </div>
            </div>`;
        // Re-bind buttons after innerHTML
        $('#sfSpotifySkip')?.addEventListener('click', async () => { await fetch('/api/spotify/skip', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cid }) }); sfToast(t('spotify.skipped'), 'info'); setTimeout(() => loadNowPlaying(cid), 1000); });
        $('#sfSpotifyPause')?.addEventListener('click', async () => { await fetch('/api/spotify/pause', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cid }) }); sfToast(t('spotify.paused'), 'info'); });
        $('#sfSpotifyResume')?.addEventListener('click', async () => { await fetch('/api/spotify/resume', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ cid }) }); sfToast(t('spotify.resumed'), 'info'); });
    } catch (_) {}
}

async function loadSpotifyQueue(cid) {
    try {
        const data = await fetch('/api/spotify/queue?cid=' + cid).then(r => r.json());
        const el = $('#sfSpotifyQueue');
        if (!el) return;
        if (!data.queue?.length) { el.innerHTML = '<div style="color:var(--text-muted);padding:12px">' + t('songs.queue_empty') + '</div>'; return; }
        el.innerHTML = data.queue.map((s, i) => `
            <div class="song-item">
                <div class="song-cover" style="width:28px;height:28px;font-size:12px">${i + 1}</div>
                <div class="song-info"><div class="song-title">${s.title}</div><div class="song-artist">${s.artist} — requested by ${s.requester}</div></div>
            </div>`).join('');
    } catch (_) {}
}
function initLikeathon() {
    $$('.btn-primary').forEach(btn => {
        if (btn.textContent.includes('Start')) btn.addEventListener('click', () => sfToast(t('likeathon.started'), 'success'));
    });
    $$('.btn').forEach(btn => {
        if (btn.textContent.includes('Reset')) btn.addEventListener('click', () => sfToast(t('likeathon.reset_done'), 'info'));
    });
}

// ═══════════════════════════════════════════
// PAGE: STREAM KEY GENERATOR
// ═══════════════════════════════════════════
function pageStreamKey() {
}
function _skGen(len, fmt, prefix) {
    prefix = prefix || '';
    if (fmt === 'uuid') return prefix + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); });
    const chars = fmt==='hex' ? '0123456789abcdef' : fmt==='base64' ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_' : 'abcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    const arr = new Uint8Array(len);
    crypto.getRandomValues(arr);
    for (let i = 0; i < len; i++) key += chars[arr[i] % chars.length];
    return prefix + key;
}
function initStreamKey() {
    function updateFull() {
        const key = $('#skResult').value;
        const url = $('#skRtmpUrl').value;
        $('#skFullUrl').value = key ? url + '/' + key : '';
    }
    $('#skGenerate').addEventListener('click', () => {
        const key = _skGen(parseInt($('#skLength').value)||32, $('#skFormat').value, $('#skPrefix').value);
        $('#skResult').value = key;
        $('#skBatchResults').style.display = 'none';
        updateFull();
    });
    $('#skGenBatch').addEventListener('click', () => {
        const keys = [];
        for (let i = 0; i < 5; i++) keys.push(_skGen(parseInt($('#skLength').value)||32, $('#skFormat').value, $('#skPrefix').value));
        $('#skResult').value = keys[0];
        $('#skBatchArea').value = keys.join('\n');
        $('#skBatchResults').style.display = '';
        updateFull();
    });
    $('#skCopy').addEventListener('click', () => { navigator.clipboard.writeText($('#skResult').value); sfToast('Key copied!','success'); });
    $('#skCopyBatch').addEventListener('click', () => { navigator.clipboard.writeText($('#skBatchArea').value); sfToast('All keys copied!','success'); });
    $('#skCopyFull').addEventListener('click', () => { navigator.clipboard.writeText($('#skFullUrl').value); sfToast('Full URL copied!','success'); });
    $('#skRtmpUrl').addEventListener('input', updateFull);
    // Auto-generate on load
    $('#skGenerate').click();
}

// ═══════════════════════════════════════════
// PAGE: ACTIVITY LOG
// ═══════════════════════════════════════════
function pageActivityLog() {
    return `<div class="page-header"><h1><i class="fa-solid fa-list-timeline"></i> ${t('nav.activitylog')}</h1>
        <p>Real-time event log from your TikTok LIVE session. Filter by type, search by username, and export.</p>
    </div>
    <div class="page-body">
        <div style="display:flex;gap:8px;margin-bottom:14px;align-items:center;flex-wrap:wrap">
            <select class="form-input" id="alFilter" style="width:150px;padding:8px 10px;font-size:12px">
                <option value="">All Events</option>
                <option value="chat">Chat</option>
                <option value="gift">Gift</option>
                <option value="follow">Follow</option>
                <option value="share">Share</option>
                <option value="like">Like</option>
                <option value="subscribe">Subscribe</option>
                <option value="viewer_milestone">Milestone</option>
            </select>
            <div style="position:relative;flex:1;min-width:160px"><i class="fa-solid fa-magnifying-glass" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px"></i>
            <input class="form-input" id="alSearch" placeholder="Search username..." style="padding-left:32px;font-size:12px"></div>
            <button class="btn btn-sm" id="alRefresh"><i class="fa-solid fa-rotate"></i> Refresh</button>
            <button class="btn btn-sm" id="alExport"><i class="fa-solid fa-download"></i> CSV</button>
            <button class="btn btn-sm" id="alClear"><i class="fa-solid fa-trash"></i> Clear</button>
        </div>
        <div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap" id="alStats"></div>
        <div class="settings-section" style="padding:0;overflow:hidden">
            <div style="max-height:520px;overflow-y:auto" id="alTableWrap">
                <table style="width:100%;border-collapse:collapse;font-size:12px">
                    <thead><tr style="background:var(--surface);position:sticky;top:0;z-index:1">
                        <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600;font-size:11px">Time</th>
                        <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600;font-size:11px">Type</th>
                        <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600;font-size:11px">User</th>
                        <th style="padding:8px 12px;text-align:left;color:var(--text-muted);font-weight:600;font-size:11px">Details</th>
                    </tr></thead>
                    <tbody id="alBody"><tr><td colspan="4" style="padding:20px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr></tbody>
                </table>
            </div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;font-size:12px;color:var(--text-muted)">
            <span id="alCount">0 events</span>
            <div style="display:flex;gap:4px"><button class="btn btn-sm" id="alPrev" disabled>&laquo; Prev</button><button class="btn btn-sm" id="alNext">Next &raquo;</button></div>
        </div>
    </div>`;
}

var _alEvents = [], _alPage = 0, _alPageSize = 50;
function _alTypeColor(t) {
    var m = { chat:'var(--blue)', gift:'var(--red)', follow:'var(--green)', share:'var(--purple)', like:'var(--pink)', subscribe:'var(--yellow)', viewer_milestone:'var(--accent)' };
    return m[t] || 'var(--text-muted)';
}
function _alTypeIcon(t) {
    var m = { chat:'fa-message', gift:'fa-gift', follow:'fa-user-plus', share:'fa-share', like:'fa-heart', subscribe:'fa-star', viewer_milestone:'fa-trophy', emote:'fa-face-smile', social:'fa-users' };
    return 'fa-solid ' + (m[t] || 'fa-circle');
}
function _alDetail(ev) {
    if (ev.type === 'chat') return ev.comment || '';
    if (ev.type === 'gift') return (ev.giftName || 'Gift') + ' x' + (ev.repeatCount || 1) + ' (' + ((ev.diamondCount||0)*(ev.repeatCount||1)) + ' diamonds)';
    if (ev.type === 'like') return (ev.likeCount || 1) + ' likes';
    if (ev.type === 'viewer_milestone') return 'Milestone: ' + (ev.milestone || '?') + ' viewers';
    if (ev.type === 'follow') return 'New follower';
    if (ev.type === 'share') return 'Shared the stream';
    if (ev.type === 'subscribe') return 'Subscribed';
    return ev.type;
}
function _alRender() {
    var body = document.getElementById('alBody');
    var filter = document.getElementById('alFilter').value;
    var search = document.getElementById('alSearch').value.toLowerCase().trim();
    var filtered = _alEvents.filter(function(e) {
        if (filter && e.type !== filter) return false;
        if (search && !(e.uniqueId||'').toLowerCase().includes(search) && !(e.nickname||'').toLowerCase().includes(search)) return false;
        return true;
    });
    var start = _alPage * _alPageSize;
    var page = filtered.slice(start, start + _alPageSize);
    if (!page.length) {
        body.innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--text-muted)">No events found</td></tr>';
    } else {
        body.innerHTML = page.map(function(ev) {
            var ts = ev.timestamp ? new Date(ev.timestamp) : new Date();
            var time = ts.getHours().toString().padStart(2,'0') + ':' + ts.getMinutes().toString().padStart(2,'0') + ':' + ts.getSeconds().toString().padStart(2,'0');
            return '<tr style="border-bottom:1px solid var(--border)">' +
                '<td style="padding:7px 12px;color:var(--text-dim);white-space:nowrap;font-family:monospace">' + time + '</td>' +
                '<td style="padding:7px 12px"><span style="display:inline-flex;align-items:center;gap:5px;color:' + _alTypeColor(ev.type) + '"><i class="' + _alTypeIcon(ev.type) + '" style="font-size:11px"></i> ' + ev.type + '</span></td>' +
                '<td style="padding:7px 12px;font-weight:600;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis">@' + (ev.uniqueId || ev.nickname || 'viewer') + '</td>' +
                '<td style="padding:7px 12px;color:var(--text-dim);max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + _alDetail(ev) + '</td></tr>';
        }).join('');
    }
    document.getElementById('alCount').textContent = filtered.length + ' events' + (filter ? ' (' + filter + ')' : '');
    document.getElementById('alPrev').disabled = _alPage === 0;
    document.getElementById('alNext').disabled = start + _alPageSize >= filtered.length;
    var stats = {};
    _alEvents.forEach(function(e) { stats[e.type] = (stats[e.type]||0) + 1; });
    document.getElementById('alStats').innerHTML = Object.entries(stats).sort(function(a,b){return b[1]-a[1];}).slice(0,6).map(function(s) {
        return '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;background:var(--surface);font-size:11px;color:' + _alTypeColor(s[0]) + '"><i class="' + _alTypeIcon(s[0]) + '"></i> ' + s[0] + ': <b>' + s[1] + '</b></span>';
    }).join('');
}
function initActivityLog() {
    function loadEvents() {
        fetch('/api/tiktok/events?limit=100').then(function(r){return r.json();}).then(function(d) {
            _alEvents = (d.events || []).reverse();
            _alPage = 0;
            _alRender();
        }).catch(function() {
            document.getElementById('alBody').innerHTML = '<tr><td colspan="4" style="padding:20px;text-align:center;color:var(--text-muted)">Failed to load events</td></tr>';
        });
    }
    loadEvents();
    document.getElementById('alFilter').addEventListener('change', function() { _alPage = 0; _alRender(); });
    document.getElementById('alSearch').addEventListener('input', function() { _alPage = 0; _alRender(); });
    document.getElementById('alRefresh').addEventListener('click', loadEvents);
    document.getElementById('alPrev').addEventListener('click', function() { if (_alPage > 0) { _alPage--; _alRender(); } });
    document.getElementById('alNext').addEventListener('click', function() { _alPage++; _alRender(); });
    document.getElementById('alClear').addEventListener('click', function() { _alEvents = []; _alRender(); });
    document.getElementById('alExport').addEventListener('click', function() {
        if (!_alEvents.length) return sfToast('No events to export', 'info');
        var csv = 'Time,Type,User,Details\n' + _alEvents.map(function(ev) {
            var ts = ev.timestamp ? new Date(ev.timestamp).toISOString() : '';
            return '"' + ts + '","' + ev.type + '","' + (ev.uniqueId||'') + '","' + _alDetail(ev).replace(/"/g,'""') + '"';
        }).join('\n');
        var blob = new Blob([csv], { type: 'text/csv' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'activity-log-' + new Date().toISOString().slice(0,10) + '.csv'; a.click();
        sfToast('Exported ' + _alEvents.length + ' events', 'success');
    });
    var _alInterval = setInterval(function() {
        if (!document.getElementById('alBody')) { clearInterval(_alInterval); return; }
        fetch('/api/tiktok/events?limit=100').then(function(r){return r.json();}).then(function(d) {
            var newEvents = (d.events || []).reverse();
            if (newEvents.length !== _alEvents.length) { _alEvents = newEvents; _alRender(); }
        }).catch(function(){});
    }, 8000);
}

// ═══════════════════════════════════════════
// PAGE: LIVE CHANNELS
// ═══════════════════════════════════════════
function pageLiveChannels() {
    return `<div class="page-header"><h1><i class="fa-solid fa-tower-broadcast"></i> ${t('nav.livechannels')}</h1>
        <p>Discover TikTok LIVE channels and connect to any stream to monitor events, test overlays, or just watch.</p>
    </div>
    <div class="page-body">
        <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">
            <div style="position:relative;flex:1"><i class="fa-solid fa-magnifying-glass" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:13px"></i>
            <input class="form-input" id="lcSearch" placeholder="Search by username..." style="padding-left:36px"></div>
            <button class="btn-primary" id="lcSearchBtn"><i class="fa-solid fa-search"></i> Search</button>
            <button class="btn" id="lcRefresh"><i class="fa-solid fa-rotate"></i></button>
        </div>
        <div id="lcGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px">
            <div style="grid-column:1/-1;text-align:center;color:var(--text-muted);padding:40px 0"><i class="fa-solid fa-tower-broadcast" style="font-size:32px;margin-bottom:12px;display:block;opacity:.3"></i>Search for a TikTok username to discover live channels</div>
        </div>
    </div>`;
}
function _lcCard(ch) {
    return '<div class="settings-section" style="padding:14px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">' +
            '<div style="width:40px;height:40px;border-radius:50%;background:var(--accent-bg);display:flex;align-items:center;justify-content:center"><i class="fa-solid fa-user" style="color:var(--accent)"></i></div>' +
            '<div><div style="font-weight:600;color:var(--white)">@' + (ch.username || '?') + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">' + (ch.title || 'TikTok LIVE') + '</div></div>' +
        '</div>' +
        '<div style="display:flex;gap:12px;font-size:11px;color:var(--text-dim);margin-bottom:10px">' +
            '<span><i class="fa-solid fa-eye"></i> ' + (ch.viewers || 0) + '</span>' +
            '<span><i class="fa-solid fa-heart"></i> ' + (ch.likes || 0) + '</span>' +
        '</div>' +
        '<button class="btn btn-sm btn-primary lc-connect" data-user="' + (ch.username || '') + '"><i class="fa-solid fa-plug"></i> Connect</button>' +
    '</div>';
}
function _lcConnect(username) {
    if (!username) return;
    fetch('/api/tiktok/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username }) })
        .then(function(r) { return r.json(); })
        .then(function(d) {
            if (d.success || d.connected) sfToast('Connected to @' + username, 'success');
            else sfToast(d.error || 'Connection failed', 'error');
        }).catch(function(e) { sfToast('Error: ' + e.message, 'error'); });
}
function initLiveChannels() {
    var grid = document.getElementById('lcGrid');
    function doSearch() {
        var q = document.getElementById('lcSearch').value.trim();
        if (!q) return;
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Searching...</div>';
        var results = [{ username: q, title: 'TikTok LIVE', viewers: 0, likes: 0 }];
        grid.innerHTML = results.map(_lcCard).join('');
        grid.querySelectorAll('.lc-connect').forEach(function(btn) {
            btn.addEventListener('click', function() { _lcConnect(btn.dataset.user); });
        });
    }
    document.getElementById('lcSearchBtn').addEventListener('click', doSearch);
    document.getElementById('lcSearch').addEventListener('keydown', function(e) { if (e.key === 'Enter') doSearch(); });
    document.getElementById('lcRefresh').addEventListener('click', doSearch);
}

// ═══════════════════════════════════════════
// CROWDCONTROL PAGES
// ═══════════════════════════════════════════

async function ccFetch(path) {
    const r = await fetch('/api/crowdcontrol' + path);
    if (!r.ok) throw new Error('API error ' + r.status);
    return r.json();
}

// ── CC HUB ──
function pageCCHub() {
    return `<div class="page-header"><h1><i class="fa-solid fa-gamepad"></i> CrowdControl Hub</h1>
        <p>Interactive games, polls, shop & leaderboards for your community.</p>
    </div>
    <div class="page-body">
        <div class="stat-grid" id="ccHubStats">
            <div class="stat-card"><div class="stat-label">Total Players</div><div class="stat-value" id="ccStatPlayers" style="color:var(--accent)">--</div></div>
            <div class="stat-card"><div class="stat-label">Games Played</div><div class="stat-value" id="ccStatGames" style="color:var(--green)">--</div></div>
            <div class="stat-card"><div class="stat-label">Coins Distributed</div><div class="stat-value" id="ccStatCoins" style="color:var(--yellow)">--</div></div>
            <div class="stat-card"><div class="stat-label">Active Now</div><div class="stat-value" id="ccStatActive" style="color:var(--pink)">--</div></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-fire"></i> Quick Actions</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">
                <button class="btn" onclick="navigateTo('ccgames')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-dice" style="font-size:20px;color:var(--accent)"></i><span style="font-size:11px">Games</span></button>
                <button class="btn" onclick="navigateTo('ccpolls')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-square-poll-vertical" style="font-size:20px;color:var(--blue)"></i><span style="font-size:11px">Polls</span></button>
                <button class="btn" onclick="navigateTo('ccshop')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-store" style="font-size:20px;color:var(--yellow)"></i><span style="font-size:11px">Shop</span></button>
                <button class="btn" onclick="navigateTo('ccleaderboard')" style="display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;height:auto"><i class="fa-solid fa-ranking-star" style="font-size:20px;color:var(--pink)"></i><span style="font-size:11px">Leaderboard</span></button>
            </div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-star"></i> Featured Games</h3>
            <div id="ccFeatured" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px"><div style="color:var(--text-muted);padding:20px;text-align:center"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-chart-line"></i> Trending</h3>
            <div id="ccTrending" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px"><div style="color:var(--text-muted);padding:20px;text-align:center"><i class="fa-solid fa-spinner fa-spin"></i></div></div>
        </div>
    </div>`;
}
function _ccGameCard(g) {
    var cat = { chance:'var(--yellow)', knowledge:'var(--blue)', action:'var(--red)', community:'var(--purple)' };
    return '<div class="settings-section" style="padding:14px;cursor:pointer" onclick="ccPlayGame(\''+g.id+'\')">' +
        '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">' +
            '<span style="font-size:24px">' + (g.icon||'🎮') + '</span>' +
            '<div><div style="font-weight:600;color:var(--white)">' + g.name + '</div>' +
            '<div style="font-size:11px;color:var(--text-muted)">' + (g.category||'game') + ' · ' + (g.difficulty||'easy') + '</div></div>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--text-dim);margin-bottom:8px">' + (g.description||'') + '</p>' +
        '<div style="display:flex;gap:8px;font-size:11px;color:var(--text-muted)">' +
            '<span><i class="fa-solid fa-users"></i> ' + (g.players?g.players.min+'-'+g.players.max:'1-50') + '</span>' +
            '<span style="color:' + (cat[g.category]||'var(--accent)') + '"><i class="fa-solid fa-star"></i> ' + (g.xpReward||0) + ' XP</span>' +
        '</div></div>';
}
async function initCCHub() {
    try {
        var stats = await ccFetch('/stats');
        var el = function(id) { return document.getElementById(id); };
        if (el('ccStatPlayers')) el('ccStatPlayers').textContent = (stats.totalPlayers||0).toLocaleString();
        if (el('ccStatGames')) el('ccStatGames').textContent = (stats.totalGamesPlayed||0).toLocaleString();
        if (el('ccStatCoins')) el('ccStatCoins').textContent = (stats.totalCoinsDistributed||0).toLocaleString();
        if (el('ccStatActive')) el('ccStatActive').textContent = (stats.activeSessions||0).toLocaleString();
    } catch(_) {}
    try {
        var featured = await ccFetch('/games/featured');
        var fArr = Array.isArray(featured) ? featured : (featured.game ? [featured.game] : featured.games || []);
        document.getElementById('ccFeatured').innerHTML = fArr.length ? fArr.map(_ccGameCard).join('') : '<div style="color:var(--text-muted)">No featured games</div>';
    } catch(_) { document.getElementById('ccFeatured').innerHTML = '<div style="color:var(--text-muted)">Could not load</div>'; }
    try {
        var trending = await ccFetch('/games/trending');
        var tArr = Array.isArray(trending) ? trending : (trending.games || []);
        document.getElementById('ccTrending').innerHTML = tArr.length ? tArr.map(_ccGameCard).join('') : '<div style="color:var(--text-muted)">No trending games</div>';
    } catch(_) { document.getElementById('ccTrending').innerHTML = '<div style="color:var(--text-muted)">Could not load</div>'; }
}

// ── CC GAMES ──
function pageCCGames() {
    return `<div class="page-header"><h1><i class="fa-solid fa-dice"></i> Games</h1>
        <p>Browse and play all available CrowdControl games.</p>
    </div>
    <div class="page-body">
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
            <button class="btn btn-sm ccCatBtn active" data-cat="all">All</button>
            <button class="btn btn-sm ccCatBtn" data-cat="chance"><span style="color:var(--yellow)">🎰</span> Chance</button>
            <button class="btn btn-sm ccCatBtn" data-cat="knowledge"><span style="color:var(--blue)">🧠</span> Knowledge</button>
            <button class="btn btn-sm ccCatBtn" data-cat="action"><span style="color:var(--red)">⚡</span> Action</button>
            <button class="btn btn-sm ccCatBtn" data-cat="community"><span style="color:var(--purple)">👥</span> Community</button>
        </div>
        <div id="ccGamesList" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px"><div style="color:var(--text-muted);padding:30px;text-align:center;grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin"></i> Loading games...</div></div>
    </div>`;
}
var _ccAllGames = [];
async function initCCGames() {
    try {
        var data = await ccFetch('/games');
        _ccAllGames = Array.isArray(data) ? data : (data.games || []);
    } catch(_) { _ccAllGames = []; }
    _ccRenderGames('all');
    document.querySelectorAll('.ccCatBtn').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ccCatBtn').forEach(function(b){b.classList.remove('active');});
            btn.classList.add('active');
            _ccRenderGames(btn.dataset.cat);
        });
    });
}
function _ccRenderGames(cat) {
    var filtered = cat === 'all' ? _ccAllGames : _ccAllGames.filter(function(g){return g.category === cat;});
    var grid = document.getElementById('ccGamesList');
    if (!filtered.length) { grid.innerHTML = '<div style="color:var(--text-muted);padding:30px;text-align:center;grid-column:1/-1">No games in this category</div>'; return; }
    grid.innerHTML = filtered.map(_ccGameCard).join('');
}

// ── CC PLAY ──
function pageCCPlay() {
    return `<div class="page-body"><div id="ccPlayArea" style="min-height:400px"><div style="text-align:center;padding:60px;color:var(--text-muted)"><i class="fa-solid fa-gamepad" style="font-size:48px;margin-bottom:16px;display:block;opacity:.3"></i><h3>Select a game to play</h3><button class="btn-primary" onclick="navigateTo('ccgames')" style="margin-top:12px"><i class="fa-solid fa-dice"></i> Browse Games</button></div></div>`;
}
function initCCPlay() {
    window._ccPlayGameId = async function(gameId) {
        var area = document.getElementById('ccPlayArea');
        if (!area) return;
        area.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin" style="font-size:24px"></i><p style="margin-top:8px">Loading ' + gameId + '...</p></div>';
        var renderers = {
            roulette: renderRouletteGame, dice: renderDiceGame, slots: renderSlotsGame,
            coinFlip: renderCoinFlipGame, cardDraw: renderCardDrawGame, trivia: renderTriviaGame,
            reactionTime: renderReactionGame, wordGuess: renderWordGuessGame, scramble: renderScrambleGame,
            targetClick: renderTargetClickGame
        };
        var renderer = renderers[gameId] || renderGenericGame;
        renderer(area, gameId);
    };
}

// ── GAME RENDERERS ──
function _ccGameHeader(area, title, icon) {
    return '<div style="display:flex;align-items:center;gap:12px;margin-bottom:20px"><button class="btn btn-sm" onclick="navigateTo(\'ccgames\')"><i class="fa-solid fa-arrow-left"></i></button><span style="font-size:28px">' + icon + '</span><h2 style="margin:0;color:var(--white)">' + title + '</h2></div>';
}
function _ccBetRow(min, max, def) {
    return '<div class="cc-bet-row" style="display:flex;align-items:center;gap:8px;margin:12px 0"><label style="font-size:12px;color:var(--text-muted)">Bet:</label>' +
        '<div class="cc-bet-btns" style="display:flex;gap:4px">' +
        [min, Math.round((min+max)/4), Math.round((min+max)/2), max].map(function(v){return '<button class="btn btn-sm cc-bet-pick" data-bet="'+v+'">'+v+'</button>';}).join('') +
        '</div><input class="form-input" type="number" id="ccBetAmt" value="'+(def||min)+'" min="'+min+'" max="'+max+'" style="width:80px;font-size:12px"></div>';
}

function renderRouletteGame(area, gameId) {
    var segs = [
        { value:100, color:'#10b981', label:'💰 100' }, { value:50, color:'#3b82f6', label:'💎 50' },
        { value:200, color:'#8b5cf6', label:'🎁 200' }, { value:0, color:'#ef4444', label:'😢 0' },
        { value:500, color:'#f59e0b', label:'🏆 500' }, { value:25, color:'#06b6d4', label:'⭐ 25' }
    ];
    area.innerHTML = _ccGameHeader(area, 'Roulette', '🎰') +
        '<div style="display:flex;gap:24px;flex-wrap:wrap"><div style="flex:1;min-width:250px">' +
        '<div class="cc-roulette-wheel" style="position:relative;width:260px;height:260px;margin:0 auto">' +
            '<div id="ccRouletteDisc" class="cc-roulette-disc" style="width:260px;height:260px;border-radius:50%;transition:transform 4s cubic-bezier(.17,.67,.12,.99);background:conic-gradient(' +
            segs.map(function(s,i){var a=i*(360/segs.length);var b=(i+1)*(360/segs.length);return s.color+' '+a+'deg '+b+'deg';}).join(',') + ')">' +
            segs.map(function(s,i){var a=(i+0.5)*(360/segs.length);return '<div style="position:absolute;top:50%;left:50%;transform:rotate('+a+'deg) translateY(-90px);transform-origin:0 0;font-size:12px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.5)">'+s.label+'</div>';}).join('') +
            '</div><div class="cc-roulette-pointer" style="position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-size:20px">▼</div></div>' +
        _ccBetRow(10, 1000, 50) +
        '<button class="btn-primary cc-spin-btn" id="ccRouletteSpin" style="width:100%;margin-top:8px"><i class="fa-solid fa-rotate"></i> SPIN</button>' +
        '<div id="ccRouletteResult"></div></div>' +
        '<div style="flex:0 0 180px"><h4 style="font-size:13px;color:var(--text-muted);margin-bottom:8px">Segments</h4>' +
        segs.map(function(s){return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:12px"><span style="width:12px;height:12px;border-radius:50%;background:'+s.color+';display:inline-block"></span> '+s.label+'</div>';}).join('') +
        '</div></div>';
    var spinning = false;
    document.querySelectorAll('.cc-bet-pick').forEach(function(b){b.addEventListener('click',function(){document.getElementById('ccBetAmt').value=b.dataset.bet;});});
    document.getElementById('ccRouletteSpin').addEventListener('click', async function() {
        if (spinning) return; spinning = true;
        var bet = parseInt(document.getElementById('ccBetAmt').value) || 50;
        var disc = document.getElementById('ccRouletteDisc');
        disc.style.transition = 'transform 4s cubic-bezier(.17,.67,.12,.99)';
        disc.style.transform = 'rotate(' + (3600 + Math.random()*360) + 'deg)';
        try {
            var d = await fetch('/api/crowdcontrol/games/roulette/spin', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bet:bet,userId:'local'}) }).then(function(r){return r.json();});
            setTimeout(function() {
                spinning = false;
                var res = document.getElementById('ccRouletteResult');
                if (d.winnings > 0) res.innerHTML = '<div style="text-align:center;padding:12px;color:var(--green);font-weight:700;font-size:16px">🎉 Won ' + d.winnings + ' coins!</div>';
                else res.innerHTML = '<div style="text-align:center;padding:12px;color:var(--red);font-size:14px">😢 Try again!</div>';
            }, 4200);
        } catch(e) { spinning = false; sfToast('Error: ' + e.message, 'error'); }
    });
}

function renderDiceGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, 'Dice Game', '🎲') +
        '<div style="text-align:center;padding:20px">' +
        '<div id="ccDiceFaces" style="display:flex;justify-content:center;gap:20px;margin-bottom:20px">' +
            '<div class="cc-dice-face" style="width:80px;height:80px;background:var(--surface);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:36px;border:2px solid var(--border)">?</div>' +
            '<div class="cc-dice-face" style="width:80px;height:80px;background:var(--surface);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:36px;border:2px solid var(--border)">?</div>' +
        '</div>' +
        '<div style="margin-bottom:12px"><label style="font-size:12px;color:var(--text-muted)">Predict: Over/Under 7</label><div style="display:flex;gap:8px;justify-content:center;margin-top:6px">' +
            '<button class="btn cc-dice-pred active" data-pred="over" style="min-width:80px">Over 7</button>' +
            '<button class="btn cc-dice-pred" data-pred="under" style="min-width:80px">Under 7</button>' +
            '<button class="btn cc-dice-pred" data-pred="exact" style="min-width:80px">Exact 7</button>' +
        '</div></div>' +
        _ccBetRow(5, 500, 25) +
        '<button class="btn-primary" id="ccDiceRoll" style="min-width:160px"><i class="fa-solid fa-dice"></i> ROLL</button>' +
        '<div id="ccDiceResult" style="margin-top:12px"></div></div>';
    var pred = 'over';
    document.querySelectorAll('.cc-dice-pred').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.cc-dice-pred').forEach(function(x){x.classList.remove('active');});b.classList.add('active');pred=b.dataset.pred;});});
    document.querySelectorAll('.cc-bet-pick').forEach(function(b){b.addEventListener('click',function(){document.getElementById('ccBetAmt').value=b.dataset.bet;});});
    document.getElementById('ccDiceRoll').addEventListener('click', async function() {
        var bet = parseInt(document.getElementById('ccBetAmt').value) || 25;
        var faces = document.querySelectorAll('.cc-dice-face');
        faces.forEach(function(f){f.textContent='🎲';f.style.animation='none';});
        try {
            var d = await fetch('/api/crowdcontrol/games/dice/roll', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bet:bet,prediction:pred,userId:'local'}) }).then(function(r){return r.json();});
            var dice = d.dice || [Math.ceil(Math.random()*6), Math.ceil(Math.random()*6)];
            var emojis = ['','⚀','⚁','⚂','⚃','⚄','⚅'];
            setTimeout(function() {
                faces[0].textContent = emojis[dice[0]] || dice[0];
                faces[1].textContent = emojis[dice[1]] || dice[1];
                var res = document.getElementById('ccDiceResult');
                var sum = dice[0]+dice[1];
                if (d.won) res.innerHTML = '<div style="color:var(--green);font-weight:700;font-size:16px">🎉 Sum: '+sum+' — Won '+d.winnings+' coins!</div>';
                else res.innerHTML = '<div style="color:var(--red);font-size:14px">Sum: '+sum+' — Better luck next time!</div>';
            }, 800);
        } catch(e) { sfToast('Error: '+e.message,'error'); }
    });
}

function renderSlotsGame(area, gameId) {
    var symbols = ['🍒','🍋','🔔','⭐','💎','7️⃣'];
    area.innerHTML = _ccGameHeader(area, 'Slot Machine', '🎯') +
        '<div style="text-align:center;padding:20px">' +
        '<div class="cc-slots-display" style="display:flex;justify-content:center;gap:8px;margin-bottom:20px">' +
            '<div class="cc-slot-reel" style="width:80px;height:100px;background:var(--surface);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:40px;border:2px solid var(--border)">🍒</div>' +
            '<div class="cc-slot-reel" style="width:80px;height:100px;background:var(--surface);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:40px;border:2px solid var(--border)">🍋</div>' +
            '<div class="cc-slot-reel" style="width:80px;height:100px;background:var(--surface);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:40px;border:2px solid var(--border)">🔔</div>' +
        '</div>' +
        _ccBetRow(5, 500, 20) +
        '<button class="btn-primary" id="ccSlotsSpin" style="min-width:160px"><i class="fa-solid fa-rotate"></i> SPIN</button>' +
        '<div id="ccSlotsResult" style="margin-top:12px"></div></div>';
    document.querySelectorAll('.cc-bet-pick').forEach(function(b){b.addEventListener('click',function(){document.getElementById('ccBetAmt').value=b.dataset.bet;});});
    var spinning = false;
    document.getElementById('ccSlotsSpin').addEventListener('click', async function() {
        if (spinning) return; spinning = true;
        var bet = parseInt(document.getElementById('ccBetAmt').value) || 20;
        var reels = document.querySelectorAll('.cc-slot-reel');
        var interval = setInterval(function(){reels.forEach(function(r){r.textContent=symbols[Math.floor(Math.random()*symbols.length)];});}, 100);
        try {
            var d = await fetch('/api/crowdcontrol/games/slots/spin', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bet:bet,userId:'local'}) }).then(function(r){return r.json();});
            var result = d.reels || [symbols[0],symbols[1],symbols[2]];
            setTimeout(function(){reels[0].textContent=result[0];},800);
            setTimeout(function(){reels[1].textContent=result[1];},1200);
            setTimeout(function(){
                reels[2].textContent=result[2];
                clearInterval(interval);
                spinning = false;
                var res = document.getElementById('ccSlotsResult');
                if (d.won) res.innerHTML = '<div style="color:var(--green);font-weight:700;font-size:16px">🎉 '+result.join(' ')+ ' — Won '+d.winnings+' coins!</div>';
                else res.innerHTML = '<div style="color:var(--red);font-size:14px">'+result.join(' ')+' — Try again!</div>';
            },1600);
        } catch(e) { clearInterval(interval); spinning = false; sfToast('Error: '+e.message,'error'); }
    });
}

function renderCoinFlipGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, 'Coin Flip', '💰') +
        '<div style="text-align:center;padding:20px">' +
        '<div id="ccCoinDisplay" style="width:120px;height:120px;border-radius:50%;background:linear-gradient(135deg,var(--yellow),#d97706);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;font-size:48px;box-shadow:0 4px 20px rgba(245,158,11,.3)">🪙</div>' +
        '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px">' +
            '<button class="btn cc-coin-side active" data-side="heads" style="min-width:100px;font-size:14px">👑 Heads</button>' +
            '<button class="btn cc-coin-side" data-side="tails" style="min-width:100px;font-size:14px">🦅 Tails</button>' +
        '</div>' +
        _ccBetRow(5, 500, 25) +
        '<button class="btn-primary" id="ccCoinFlip" style="min-width:160px"><i class="fa-solid fa-coins"></i> FLIP</button>' +
        '<div id="ccCoinResult" style="margin-top:12px"></div></div>';
    var side = 'heads';
    document.querySelectorAll('.cc-coin-side').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('.cc-coin-side').forEach(function(x){x.classList.remove('active');});b.classList.add('active');side=b.dataset.side;});});
    document.querySelectorAll('.cc-bet-pick').forEach(function(b){b.addEventListener('click',function(){document.getElementById('ccBetAmt').value=b.dataset.bet;});});
    document.getElementById('ccCoinFlip').addEventListener('click', async function() {
        var bet = parseInt(document.getElementById('ccBetAmt').value) || 25;
        var coin = document.getElementById('ccCoinDisplay');
        coin.style.animation = 'none'; coin.offsetHeight; coin.style.animation = '';
        coin.textContent = '🪙';
        try {
            var d = await fetch('/api/crowdcontrol/games/coin-flip/flip', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bet:bet,choice:side,userId:'local'}) }).then(function(r){return r.json();});
            setTimeout(function() {
                coin.textContent = d.result === 'heads' ? '👑' : '🦅';
                var res = document.getElementById('ccCoinResult');
                if (d.won) res.innerHTML = '<div style="color:var(--green);font-weight:700;font-size:16px">🎉 '+d.result+'! Won '+d.winnings+' coins!</div>';
                else res.innerHTML = '<div style="color:var(--red);font-size:14px">'+d.result+' — You lose!</div>';
            }, 1000);
        } catch(e) { sfToast('Error: '+e.message,'error'); }
    });
}

function renderCardDrawGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, 'Card Draw', '🃏') +
        '<div style="text-align:center;padding:20px">' +
        '<div id="ccCards" style="display:flex;justify-content:center;gap:8px;margin-bottom:20px">' +
            [0,1,2,3,4].map(function(){return '<div class="cc-card" style="width:60px;height:90px;background:linear-gradient(135deg,var(--accent),var(--purple));border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:24px;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">🂠</div>';}).join('') +
        '</div>' +
        _ccBetRow(10, 500, 25) +
        '<button class="btn-primary" id="ccCardDraw" style="min-width:160px"><i class="fa-solid fa-hand"></i> DRAW</button>' +
        '<div id="ccCardResult" style="margin-top:12px"></div></div>';
    document.querySelectorAll('.cc-bet-pick').forEach(function(b){b.addEventListener('click',function(){document.getElementById('ccBetAmt').value=b.dataset.bet;});});
    document.getElementById('ccCardDraw').addEventListener('click', async function() {
        var bet = parseInt(document.getElementById('ccBetAmt').value) || 25;
        var cards = document.querySelectorAll('.cc-card');
        cards.forEach(function(c){c.textContent='🂠';});
        try {
            var d = await fetch('/api/crowdcontrol/games/card-draw/draw', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({bet:bet,userId:'local'}) }).then(function(r){return r.json();});
            var hand = d.hand || ['A♠','K♥','Q♦','J♣','10♠'];
            hand.forEach(function(c,i){setTimeout(function(){cards[i].textContent=c;cards[i].style.background='var(--surface)';cards[i].style.border='1px solid var(--border)';cards[i].style.color=(c.includes('♥')||c.includes('♦'))?'var(--red)':'var(--white)';cards[i].style.fontSize='14px';},i*300);});
            setTimeout(function() {
                var res = document.getElementById('ccCardResult');
                res.innerHTML = '<div style="font-size:14px;color:var(--accent);font-weight:600">' + (d.handRank||'Hand') + '</div>' +
                    (d.won ? '<div style="color:var(--green);font-weight:700;margin-top:4px">🎉 Won '+d.winnings+' coins!</div>' : '<div style="color:var(--text-muted);margin-top:4px">No winning hand</div>');
            }, hand.length * 300 + 200);
        } catch(e) { sfToast('Error: '+e.message,'error'); }
    });
}

function renderTriviaGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, 'Trivia Challenge', '🧠') +
        '<div id="ccTriviaArea" style="max-width:600px;margin:0 auto">' +
        '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px" id="ccTriviaCats"></div>' +
        '<div id="ccTriviaQ" style="background:var(--surface);border-radius:var(--radius);padding:24px;text-align:center"><p style="color:var(--text-muted)">Select a category to start</p></div>' +
        '<div id="ccTriviaOpts" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px"></div>' +
        '<div id="ccTriviaScore" style="text-align:center;margin-top:12px;font-size:13px;color:var(--text-muted)"></div></div>';
    var score = 0, total = 0, currentAnswer = null;
    fetch('/api/crowdcontrol/games/trivia/categories').then(function(r){return r.json();}).then(function(cats) {
        var arr = Array.isArray(cats) ? cats : (cats.categories || ['gaming','music','movies','science','history']);
        document.getElementById('ccTriviaCats').innerHTML = arr.map(function(c){return '<button class="btn btn-sm cc-trivia-cat" data-cat="'+c+'">'+c+'</button>';}).join('');
        document.querySelectorAll('.cc-trivia-cat').forEach(function(b){b.addEventListener('click',function(){loadQuestion(b.dataset.cat);});});
    }).catch(function(){});
    function loadQuestion(cat) {
        fetch('/api/crowdcontrol/games/trivia/next-question', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({category:cat,userId:'local'}) }).then(function(r){return r.json();}).then(function(d) {
            currentAnswer = d.correctIndex !== undefined ? d.correctIndex : null;
            document.getElementById('ccTriviaQ').innerHTML = '<div style="font-size:16px;font-weight:600;color:var(--white)">' + (d.question||'Question?') + '</div><div style="font-size:11px;color:var(--text-muted);margin-top:4px">' + (d.category||cat) + ' · ' + (d.difficulty||'medium') + '</div>';
            var opts = d.options || ['A','B','C','D'];
            document.getElementById('ccTriviaOpts').innerHTML = opts.map(function(o,i){return '<button class="btn cc-trivia-opt" data-idx="'+i+'" style="padding:12px;font-size:13px;text-align:left">'+o+'</button>';}).join('');
            document.querySelectorAll('.cc-trivia-opt').forEach(function(b){b.addEventListener('click',function(){answerQuestion(parseInt(b.dataset.idx), cat);});});
        }).catch(function(e){sfToast('Error: '+e.message,'error');});
    }
    function answerQuestion(idx, cat) {
        total++;
        fetch('/api/crowdcontrol/games/trivia/answer', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({answerIndex:idx,userId:'local'}) }).then(function(r){return r.json();}).then(function(d) {
            var correct = d.correct;
            if (correct) score++;
            document.querySelectorAll('.cc-trivia-opt').forEach(function(b){
                b.disabled = true;
                if (parseInt(b.dataset.idx) === (d.correctIndex !== undefined ? d.correctIndex : currentAnswer)) b.style.background = 'rgba(16,185,129,.2)';
                if (parseInt(b.dataset.idx) === idx && !correct) b.style.background = 'rgba(239,68,68,.2)';
            });
            document.getElementById('ccTriviaScore').textContent = '✅ ' + score + '/' + total + ' correct' + (d.points ? ' · +' + d.points + ' pts' : '');
            setTimeout(function(){loadQuestion(cat);}, 2000);
        }).catch(function(){
            total--; sfToast('Error submitting answer','error');
        });
    }
}

function renderReactionGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, 'Reaction Time', '⚡') +
        '<div style="text-align:center;padding:20px">' +
        '<div id="ccReactionBox" style="width:300px;height:300px;border-radius:16px;background:var(--surface);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;cursor:pointer;user-select:none;border:2px solid var(--border);transition:background .2s">' +
            '<div style="color:var(--text-muted);font-size:14px">Click "Start" to begin</div></div>' +
        '<button class="btn-primary" id="ccReactionStart" style="min-width:160px"><i class="fa-solid fa-bolt"></i> Start</button>' +
        '<div id="ccReactionResult" style="margin-top:12px;font-size:14px"></div></div>';
    var state = 'idle', startTime = 0;
    var box = document.getElementById('ccReactionBox');
    document.getElementById('ccReactionStart').addEventListener('click', function() {
        state = 'waiting';
        box.style.background = '#ef4444';
        box.innerHTML = '<div style="color:#fff;font-size:18px;font-weight:700">Wait for GREEN...</div>';
        var delay = 1000 + Math.random() * 4000;
        setTimeout(function() {
            if (state !== 'waiting') return;
            state = 'ready';
            startTime = Date.now();
            box.style.background = '#10b981';
            box.innerHTML = '<div style="color:#fff;font-size:24px;font-weight:700">CLICK NOW!</div>';
        }, delay);
    });
    box.addEventListener('click', function() {
        if (state === 'ready') {
            var ms = Date.now() - startTime;
            state = 'idle';
            box.style.background = 'var(--surface)';
            box.innerHTML = '<div style="font-size:36px;font-weight:700;color:var(--accent)">' + ms + 'ms</div>';
            var res = document.getElementById('ccReactionResult');
            if (ms < 200) res.innerHTML = '<span style="color:var(--green)">⚡ Incredible!</span>';
            else if (ms < 400) res.innerHTML = '<span style="color:var(--accent)">👍 Good!</span>';
            else res.innerHTML = '<span style="color:var(--yellow)">🐢 Slow...</span>';
            fetch('/api/crowdcontrol/games/reaction/click', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({reactionTime:ms,userId:'local'}) }).catch(function(){});
        } else if (state === 'waiting') {
            state = 'idle';
            box.style.background = 'var(--surface)';
            box.innerHTML = '<div style="color:var(--red);font-size:16px">Too early! Click Start again.</div>';
        }
    });
}

function renderWordGuessGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, 'Word Guess', '📝') +
        '<div style="max-width:500px;margin:0 auto;text-align:center">' +
        '<div id="ccWordHint" style="background:var(--surface);border-radius:var(--radius);padding:20px;margin-bottom:16px"><p style="color:var(--text-muted)">Loading...</p></div>' +
        '<div id="ccWordDisplay" style="font-size:28px;letter-spacing:8px;font-weight:700;color:var(--accent);margin-bottom:16px"></div>' +
        '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px"><input class="form-input" id="ccWordInput" placeholder="Type a letter..." maxlength="1" style="width:60px;text-align:center;font-size:18px"><button class="btn-primary" id="ccWordGuess"><i class="fa-solid fa-paper-plane"></i></button></div>' +
        '<div id="ccWordGuessed" style="font-size:12px;color:var(--text-muted);margin-bottom:8px"></div>' +
        '<div id="ccWordResult"></div></div>';
    var guessed = [], sessionId = null;
    function loadWord() {
        fetch('/api/crowdcontrol/games/word-guess/new', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:'local'}) }).then(function(r){return r.json();}).then(function(d) {
            sessionId = d.sessionId;
            document.getElementById('ccWordHint').innerHTML = '<div style="font-size:13px;color:var(--text-muted)">Hint: ' + (d.hint||'No hint') + '</div><div style="font-size:11px;color:var(--text-dim);margin-top:4px">' + (d.maxGuesses||6) + ' guesses remaining</div>';
            document.getElementById('ccWordDisplay').textContent = d.display || '_ _ _ _';
            guessed = [];
            document.getElementById('ccWordGuessed').textContent = '';
            document.getElementById('ccWordResult').innerHTML = '';
        }).catch(function(e){sfToast('Error: '+e.message,'error');});
    }
    loadWord();
    function doGuess() {
        var letter = document.getElementById('ccWordInput').value.trim().toLowerCase();
        document.getElementById('ccWordInput').value = '';
        if (!letter || guessed.includes(letter)) return;
        guessed.push(letter);
        document.getElementById('ccWordGuessed').textContent = 'Guessed: ' + guessed.join(', ');
        fetch('/api/crowdcontrol/games/word-guess/guess', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({letter:letter,sessionId:sessionId,userId:'local'}) }).then(function(r){return r.json();}).then(function(d) {
            if (d.display) document.getElementById('ccWordDisplay').textContent = d.display;
            if (d.won) { document.getElementById('ccWordResult').innerHTML = '<div style="color:var(--green);font-weight:700;font-size:16px">🎉 You got it! +' + (d.points||0) + ' pts</div>'; setTimeout(loadWord, 2000); }
            else if (d.lost) { document.getElementById('ccWordResult').innerHTML = '<div style="color:var(--red);font-size:14px">😢 The word was: ' + (d.word||'?') + '</div>'; setTimeout(loadWord, 2000); }
            else { document.getElementById('ccWordHint').innerHTML = '<div style="font-size:13px;color:var(--text-muted)">Hint: ' + (d.hint||'') + '</div><div style="font-size:11px;color:var(--text-dim);margin-top:4px">' + (d.remaining||0) + ' guesses remaining</div>'; }
        }).catch(function(e){sfToast('Error: '+e.message,'error');});
    }
    document.getElementById('ccWordGuess').addEventListener('click', doGuess);
    document.getElementById('ccWordInput').addEventListener('keydown', function(e){if(e.key==='Enter')doGuess();});
}

function renderScrambleGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, 'Scramble', '🔤') +
        '<div style="max-width:500px;margin:0 auto;text-align:center">' +
        '<div id="ccScrambleWord" style="font-size:36px;letter-spacing:6px;font-weight:700;color:var(--accent);padding:30px;background:var(--surface);border-radius:var(--radius);margin-bottom:16px">...</div>' +
        '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:12px"><input class="form-input" id="ccScrambleInput" placeholder="Unscramble the word..." style="width:200px;text-align:center;font-size:16px"><button class="btn-primary" id="ccScrambleSolve"><i class="fa-solid fa-check"></i> Solve</button></div>' +
        '<div id="ccScrambleResult"></div></div>';
    var sessionId = null;
    function loadScramble() {
        fetch('/api/crowdcontrol/games/scramble/new', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({userId:'local'}) }).then(function(r){return r.json();}).then(function(d) {
            sessionId = d.sessionId;
            document.getElementById('ccScrambleWord').textContent = d.scrambled || '???';
            document.getElementById('ccScrambleInput').value = '';
            document.getElementById('ccScrambleResult').innerHTML = '';
        }).catch(function(e){sfToast('Error: '+e.message,'error');});
    }
    loadScramble();
    function doSolve() {
        var answer = document.getElementById('ccScrambleInput').value.trim().toLowerCase();
        if (!answer) return;
        fetch('/api/crowdcontrol/games/scramble/solve', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({answer:answer,sessionId:sessionId,userId:'local'}) }).then(function(r){return r.json();}).then(function(d) {
            if (d.correct) { document.getElementById('ccScrambleResult').innerHTML = '<div style="color:var(--green);font-weight:700;font-size:16px">🎉 Correct! +' + (d.points||0) + ' pts</div>'; setTimeout(loadScramble, 2000); }
            else document.getElementById('ccScrambleResult').innerHTML = '<div style="color:var(--red);font-size:14px">❌ Wrong! Try again.</div>';
        }).catch(function(e){sfToast('Error: '+e.message,'error');});
    }
    document.getElementById('ccScrambleSolve').addEventListener('click', doSolve);
    document.getElementById('ccScrambleInput').addEventListener('keydown', function(e){if(e.key==='Enter')doSolve();});
}

function renderTargetClickGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, 'Target Click', '🎯') +
        '<div style="text-align:center">' +
        '<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:12px;color:var(--text-muted)"><span id="ccTargetScore">Score: 0</span><span id="ccTargetTime">Time: 30s</span></div>' +
        '<div id="ccTargetArea" style="position:relative;width:100%;height:350px;background:var(--surface);border-radius:var(--radius);overflow:hidden;cursor:crosshair;border:2px solid var(--border)">' +
            '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--text-muted)">Click Start to play</div></div>' +
        '<button class="btn-primary" id="ccTargetStart" style="margin-top:12px;min-width:160px"><i class="fa-solid fa-crosshairs"></i> Start</button>' +
        '<div id="ccTargetResult" style="margin-top:8px"></div></div>';
    var score = 0, timer = null, timeLeft = 30;
    function spawnTarget() {
        var area = document.getElementById('ccTargetArea');
        if (!area) return;
        area.querySelectorAll('.cc-target').forEach(function(t){t.remove();});
        var size = 30 + Math.random() * 30;
        var x = Math.random() * (area.offsetWidth - size);
        var y = Math.random() * (area.offsetHeight - size);
        var t = document.createElement('div');
        t.className = 'cc-target';
        t.style.cssText = 'position:absolute;width:'+size+'px;height:'+size+'px;border-radius:50%;background:var(--red);left:'+x+'px;top:'+y+'px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;color:#fff;font-weight:700;box-shadow:0 0 10px rgba(239,68,68,.4);transition:transform .1s';
        t.textContent = '🎯';
        t.addEventListener('click', function() { score++; document.getElementById('ccTargetScore').textContent = 'Score: ' + score; t.remove(); spawnTarget(); });
        area.appendChild(t);
    }
    document.getElementById('ccTargetStart').addEventListener('click', function() {
        score = 0; timeLeft = 30;
        document.getElementById('ccTargetScore').textContent = 'Score: 0';
        document.getElementById('ccTargetResult').innerHTML = '';
        document.getElementById('ccTargetArea').innerHTML = '';
        spawnTarget();
        if (timer) clearInterval(timer);
        timer = setInterval(function() {
            timeLeft--;
            document.getElementById('ccTargetTime').textContent = 'Time: ' + timeLeft + 's';
            if (timeLeft <= 0) {
                clearInterval(timer);
                document.getElementById('ccTargetArea').innerHTML = '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center"><div style="font-size:36px;font-weight:700;color:var(--accent)">' + score + '</div><div style="color:var(--text-muted);font-size:13px">targets hit</div></div>';
                document.getElementById('ccTargetResult').innerHTML = '<div style="color:var(--accent);font-weight:600">Game over! Score: ' + score + '</div>';
                fetch('/api/crowdcontrol/games/target-click/result', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({score:score,userId:'local'}) }).catch(function(){});
            }
        }, 1000);
    });
}

function renderGenericGame(area, gameId) {
    area.innerHTML = _ccGameHeader(area, gameId, '🎮') +
        '<div style="text-align:center;padding:40px;color:var(--text-muted)"><i class="fa-solid fa-wrench" style="font-size:32px;margin-bottom:12px;display:block;opacity:.3"></i>' +
        '<h3>Game: ' + gameId + '</h3><p style="font-size:13px;margin-top:8px">This game is coming soon! Check back later.</p>' +
        '<button class="btn" onclick="navigateTo(\'ccgames\')" style="margin-top:16px"><i class="fa-solid fa-arrow-left"></i> Back to Games</button></div>';
}

// ── CC POLLS ──
function pageCCPolls() {
    return `<div class="page-header"><h1><i class="fa-solid fa-square-poll-vertical"></i> Polls</h1>
        <p>Create polls for your community to vote on.</p>
    </div>
    <div class="page-body">
        <div style="display:flex;gap:8px;margin-bottom:16px">
            <button class="btn-primary" id="ccNewPoll"><i class="fa-solid fa-plus"></i> New Poll</button>
        </div>
        <div id="ccPollsList"><div style="color:var(--text-muted);padding:30px;text-align:center"><i class="fa-solid fa-spinner fa-spin"></i> Loading polls...</div></div>
    </div>`;
}
async function initCCPolls() {
    async function loadPolls() {
        try {
            var d = await ccFetch('/polls');
            var polls = Array.isArray(d) ? d : (d.polls || []);
            var el = document.getElementById('ccPollsList');
            if (!polls.length) { el.innerHTML = '<div style="color:var(--text-muted);padding:30px;text-align:center">No polls yet. Create one!</div>'; return; }
            el.innerHTML = polls.map(function(p) {
                var totalVotes = (p.options||[]).reduce(function(s,o){return s+(o.votes||0);},0);
                return '<div class="settings-section" style="margin-bottom:12px"><h4 style="color:var(--white);margin-bottom:8px">' + (p.question||'Poll') + '</h4>' +
                    '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">' + (p.status||'active') + ' · ' + totalVotes + ' votes</div>' +
                    (p.options||[]).map(function(o) {
                        var pct = totalVotes ? Math.round((o.votes||0)/totalVotes*100) : 0;
                        return '<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:2px"><span>' + o.text + '</span><span style="color:var(--accent)">' + pct + '%</span></div>' +
                            '<div class="progress-bar" style="height:6px"><div class="progress-fill" style="width:'+pct+'%"></div></div></div>';
                    }).join('') + '</div>';
            }).join('');
        } catch(_) { document.getElementById('ccPollsList').innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center">Failed to load polls</div>'; }
    }
    loadPolls();
    document.getElementById('ccNewPoll').addEventListener('click', function() {
        var body = '<div class="form-group"><label>Question</label><input class="form-input" id="ccPollQ" placeholder="What should we play next?"></div>' +
            '<div class="form-group"><label>Options (one per line)</label><textarea class="form-input" id="ccPollOpts" rows="4" placeholder="Option 1\nOption 2\nOption 3"></textarea></div>' +
            '<div class="form-group"><label>Duration (seconds)</label><input class="form-input" type="number" id="ccPollDur" value="60" min="10" max="600"></div>';
        sfModal('New Poll', body, async function() {
            var q = document.getElementById('ccPollQ').value.trim();
            var opts = document.getElementById('ccPollOpts').value.split('\n').map(function(s){return s.trim();}).filter(Boolean);
            var dur = parseInt(document.getElementById('ccPollDur').value) || 60;
            if (!q || opts.length < 2) return sfToast('Need question + 2+ options', 'error');
            try {
                await fetch('/api/crowdcontrol/polls', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({question:q,options:opts,duration:dur*1000}) });
                sfToast('Poll created!', 'success');
                loadPolls();
            } catch(e) { sfToast('Error: '+e.message,'error'); }
        }, 'Create');
    });
}

// ── CC SHOP ──
function pageCCShop() {
    return `<div class="page-header"><h1><i class="fa-solid fa-store"></i> Shop</h1>
        <p>Browse and purchase items with your StreamCoins and StreamGems.</p>
    </div>
    <div class="page-body">
        <div id="ccShopBalance" style="display:flex;gap:16px;margin-bottom:16px;font-size:14px">
            <span style="color:var(--yellow)">🪙 <b id="ccShopCoins">--</b> Coins</span>
            <span style="color:var(--accent)">💎 <b id="ccShopGems">--</b> Gems</span>
        </div>
        <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap">
            <button class="btn btn-sm ccShopTab active" data-tab="avatars">🎭 Avatars</button>
            <button class="btn btn-sm ccShopTab" data-tab="frames">🖼️ Frames</button>
            <button class="btn btn-sm ccShopTab" data-tab="effects">✨ Effects</button>
            <button class="btn btn-sm ccShopTab" data-tab="badges">🏅 Badges</button>
        </div>
        <div id="ccShopItems" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px"><div style="color:var(--text-muted);padding:30px;text-align:center;grid-column:1/-1"><i class="fa-solid fa-spinner fa-spin"></i></div></div>
    </div>`;
}
var _ccShopData = null;
async function initCCShop() {
    try {
        _ccShopData = await ccFetch('/shop');
    } catch(_) { _ccShopData = { avatars:[], frames:[], effects:[], badges:[] }; }
    var rarityColors = { common:'#9ca3af', rare:'#3b82f6', epic:'#8b5cf6', legendary:'#f59e0b' };
    function renderTab(tab) {
        var items = (_ccShopData && _ccShopData[tab]) || [];
        var grid = document.getElementById('ccShopItems');
        if (!items.length) { grid.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center;grid-column:1/-1">No items</div>'; return; }
        grid.innerHTML = items.map(function(item) {
            var rc = rarityColors[item.rarity] || '#9ca3af';
            return '<div class="settings-section" style="padding:12px;text-align:center;border:1px solid ' + rc + '22">' +
                '<div style="font-size:11px;color:' + rc + ';text-transform:uppercase;font-weight:600;margin-bottom:4px">' + (item.rarity||'common') + '</div>' +
                '<div style="font-size:18px;margin-bottom:4px">' + (tab==='avatars'?'🎭':tab==='frames'?'🖼️':tab==='effects'?'✨':'🏅') + '</div>' +
                '<div style="font-weight:600;color:var(--white);font-size:13px">' + item.name + '</div>' +
                '<div style="font-size:12px;color:var(--text-muted);margin-top:4px">' + (item.currency==='gems'?'💎':'🪙') + ' ' + item.cost + '</div>' +
                (item.cost > 0 ? '<button class="btn btn-sm cc-buy-item" data-id="'+item.id+'" data-tab="'+tab+'" style="margin-top:8px;width:100%">Buy</button>' : '<div style="font-size:11px;color:var(--green);margin-top:8px">✓ Free</div>') +
            '</div>';
        }).join('');
        grid.querySelectorAll('.cc-buy-item').forEach(function(b) {
            b.addEventListener('click', async function() {
                try {
                    var d = await fetch('/api/crowdcontrol/shop/buy', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({itemId:b.dataset.id,category:b.dataset.tab,userId:'local'}) }).then(function(r){return r.json();});
                    if (d.success) sfToast('Purchased ' + (d.itemName||b.dataset.id) + '!', 'success');
                    else sfToast(d.error || 'Purchase failed', 'error');
                } catch(e) { sfToast('Error: '+e.message,'error'); }
            });
        });
    }
    renderTab('avatars');
    document.querySelectorAll('.ccShopTab').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ccShopTab').forEach(function(b){b.classList.remove('active');});
            btn.classList.add('active');
            renderTab(btn.dataset.tab);
        });
    });
}

// ── CC LEADERBOARD ──
function pageCCLeaderboard() {
    return `<div class="page-header"><h1><i class="fa-solid fa-ranking-star"></i> Leaderboard</h1>
        <p>Top players ranked by coins, XP, and wins.</p>
    </div>
    <div class="page-body">
        <div style="display:flex;gap:8px;margin-bottom:16px">
            <button class="btn btn-sm ccLbTab active" data-tab="global">🏆 Global</button>
            <button class="btn btn-sm ccLbTab" data-tab="weekly">📅 Weekly</button>
        </div>
        <div id="ccLbList"><div style="color:var(--text-muted);padding:30px;text-align:center"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div></div>
    </div>`;
}
async function initCCLeaderboard() {
    async function loadLb(tab) {
        var el = document.getElementById('ccLbList');
        try {
            var d = await ccFetch('/games/leaderboard/global');
            var players = Array.isArray(d) ? d : (d.leaderboard || d.players || []);
            if (!players.length) { el.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center">No players yet</div>'; return; }
            var medals = ['🥇','🥈','🥉'];
            el.innerHTML = '<div style="display:flex;flex-direction:column;gap:6px">' + players.slice(0,50).map(function(p,i) {
                return '<div class="settings-section" style="padding:10px 14px;display:flex;align-items:center;gap:12px">' +
                    '<div style="width:30px;text-align:center;font-size:' + (i<3?'18px':'13px') + ';font-weight:700;color:' + (i<3?'var(--yellow)':'var(--text-muted)') + '">' + (medals[i]||(i+1)) + '</div>' +
                    '<div style="flex:1"><div style="font-weight:600;color:var(--white)">' + (p.username||p.display_name||'Player '+(i+1)) + '</div>' +
                    '<div style="font-size:11px;color:var(--text-muted)">Lv.' + (p.level||1) + '</div></div>' +
                    '<div style="text-align:right"><div style="color:var(--yellow);font-weight:600;font-size:13px">🪙 ' + (p.coins||p.balance||0).toLocaleString() + '</div>' +
                    '<div style="font-size:11px;color:var(--text-muted)">' + (p.total_wins||p.wins||0) + ' wins</div></div></div>';
            }).join('') + '</div>';
        } catch(_) { el.innerHTML = '<div style="color:var(--text-muted);padding:20px;text-align:center">Failed to load leaderboard</div>'; }
    }
    loadLb('global');
    document.querySelectorAll('.ccLbTab').forEach(function(btn) {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ccLbTab').forEach(function(b){b.classList.remove('active');});
            btn.classList.add('active');
            loadLb(btn.dataset.tab);
        });
    });
}

// ── CC AUTH PAGES ──
function pageCCRegister() {
    return `<div class="page-body" style="max-width:400px;margin:60px auto"><div class="settings-section" style="padding:30px">
        <h2 style="text-align:center;margin-bottom:20px"><i class="fa-solid fa-gamepad" style="color:var(--accent)"></i> CrowdControl</h2>
        <div class="form-group"><label>Username</label><input class="form-input" id="ccRegUser" placeholder="Choose a username"></div>
        <div class="form-group"><label>Email</label><input class="form-input" type="email" id="ccRegEmail" placeholder="your@email.com"></div>
        <div class="form-group"><label>Password</label><input class="form-input" type="password" id="ccRegPass" placeholder="Min 6 characters"></div>
        <button class="btn-primary" id="ccRegBtn" style="width:100%;margin-top:8px"><i class="fa-solid fa-user-plus"></i> Register</button>
        <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:12px">Already have an account? <a href="#" onclick="navigateTo('cclogin');return false" style="color:var(--accent)">Login</a></p>
    </div></div>`;
}
function initCCRegister() {
    document.getElementById('ccRegBtn').addEventListener('click', async function() {
        var u = document.getElementById('ccRegUser').value.trim();
        var e = document.getElementById('ccRegEmail').value.trim();
        var p = document.getElementById('ccRegPass').value;
        if (!u || !e || p.length < 6) return sfToast('Fill all fields (password min 6 chars)', 'error');
        try {
            var d = await fetch('/api/auth/register', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u,email:e,password:p}) }).then(function(r){return r.json();});
            if (d.token || d.success) { sfToast('Registered! Welcome ' + u, 'success'); if (d.token) localStorage.setItem('cc_token', d.token); navigateTo('cchub'); }
            else sfToast(d.error || 'Registration failed', 'error');
        } catch(err) { sfToast('Error: ' + err.message, 'error'); }
    });
}
function pageCCLogin() {
    return `<div class="page-body" style="max-width:400px;margin:60px auto"><div class="settings-section" style="padding:30px">
        <h2 style="text-align:center;margin-bottom:20px"><i class="fa-solid fa-gamepad" style="color:var(--accent)"></i> Login</h2>
        <div class="form-group"><label>Username or Email</label><input class="form-input" id="ccLoginUser" placeholder="Username or email"></div>
        <div class="form-group"><label>Password</label><input class="form-input" type="password" id="ccLoginPass" placeholder="Password"></div>
        <button class="btn-primary" id="ccLoginBtn" style="width:100%;margin-top:8px"><i class="fa-solid fa-right-to-bracket"></i> Login</button>
        <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:12px">No account? <a href="#" onclick="navigateTo('ccregister');return false" style="color:var(--accent)">Register</a></p>
    </div></div>`;
}
function initCCLogin() {
    document.getElementById('ccLoginBtn').addEventListener('click', async function() {
        var u = document.getElementById('ccLoginUser').value.trim();
        var p = document.getElementById('ccLoginPass').value;
        if (!u || !p) return sfToast('Fill all fields', 'error');
        try {
            var d = await fetch('/api/auth/login', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({username:u,password:p}) }).then(function(r){return r.json();});
            if (d.token) { localStorage.setItem('cc_token', d.token); sfToast('Welcome back!', 'success'); navigateTo('cchub'); }
            else sfToast(d.error || 'Login failed', 'error');
        } catch(err) { sfToast('Error: ' + err.message, 'error'); }
    });
}
function pageCCProfile() {
    return `<div class="page-body" style="max-width:500px;margin:40px auto"><div class="settings-section" style="padding:24px">
        <h2 style="margin-bottom:16px"><i class="fa-solid fa-user"></i> Profile</h2>
        <div id="ccProfileData" style="color:var(--text-muted);text-align:center;padding:20px"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</div>
    </div></div>`;
}
async function initCCProfile() {
    try {
        var d = await ccFetch('/user/local');
        var el = document.getElementById('ccProfileData');
        el.innerHTML = '<div style="text-align:center">' +
            '<div style="width:80px;height:80px;border-radius:50%;background:var(--accent-bg);margin:0 auto 12px;display:flex;align-items:center;justify-content:center;font-size:32px"><i class="fa-solid fa-user" style="color:var(--accent)"></i></div>' +
            '<h3 style="color:var(--white)">' + (d.username||d.display_name||'Player') + '</h3>' +
            '<div style="font-size:12px;color:var(--text-muted);margin-bottom:16px">Level ' + (d.level||1) + ' · ' + (d.xp||0) + ' XP</div>' +
            '<div class="stat-grid" style="margin-bottom:16px">' +
                '<div class="stat-card"><div class="stat-label">Coins</div><div class="stat-value" style="color:var(--yellow)">' + (d.coins||d.balance||0).toLocaleString() + '</div></div>' +
                '<div class="stat-card"><div class="stat-label">Gems</div><div class="stat-value" style="color:var(--accent)">' + (d.gems||0).toLocaleString() + '</div></div>' +
                '<div class="stat-card"><div class="stat-label">Wins</div><div class="stat-value" style="color:var(--green)">' + (d.total_wins||0) + '</div></div>' +
                '<div class="stat-card"><div class="stat-label">Games</div><div class="stat-value">' + (d.total_games||0) + '</div></div>' +
            '</div></div>';
    } catch(_) { document.getElementById('ccProfileData').innerHTML = '<div style="color:var(--text-muted)">Could not load profile. <a href="#" onclick="navigateTo(\'cclogin\');return false" style="color:var(--accent)">Login</a></div>'; }
}
function pageCCSettings() {
    return `<div class="page-body" style="max-width:500px;margin:40px auto"><div class="settings-section" style="padding:24px">
        <h2 style="margin-bottom:16px"><i class="fa-solid fa-gear"></i> CrowdControl Settings</h2>
        <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">Enable CrowdControl</div><div class="settings-row-desc">Allow viewers to play games during your stream</div></div>
            <label class="toggle"><input type="checkbox" id="ccSettingsEnabled" checked><span class="toggle-slider"></span></label></div>
        <div class="settings-row"><div class="settings-row-info"><div class="settings-row-label">Auto-start Games</div><div class="settings-row-desc">Automatically start featured games when going live</div></div>
            <label class="toggle"><input type="checkbox" id="ccSettingsAutoStart"><span class="toggle-slider"></span></label></div>
        <div class="form-group" style="margin-top:12px"><label>Starting Coins for New Players</label><input class="form-input" type="number" id="ccSettingsStartCoins" value="100" min="0"></div>
        <div class="form-group"><label>Max Bet Limit</label><input class="form-input" type="number" id="ccSettingsMaxBet" value="1000" min="10"></div>
        <button class="btn-primary" id="ccSettingsSave" style="margin-top:8px"><i class="fa-solid fa-save"></i> Save Settings</button>
    </div></div>`;
}
function initCCSettings() {
    var cfg = sfLoad('cc_settings', { enabled:true, autoStart:false, startCoins:100, maxBet:1000 });
    document.getElementById('ccSettingsEnabled').checked = cfg.enabled;
    document.getElementById('ccSettingsAutoStart').checked = cfg.autoStart;
    document.getElementById('ccSettingsStartCoins').value = cfg.startCoins;
    document.getElementById('ccSettingsMaxBet').value = cfg.maxBet;
    document.getElementById('ccSettingsSave').addEventListener('click', function() {
        cfg.enabled = document.getElementById('ccSettingsEnabled').checked;
        cfg.autoStart = document.getElementById('ccSettingsAutoStart').checked;
        cfg.startCoins = parseInt(document.getElementById('ccSettingsStartCoins').value) || 100;
        cfg.maxBet = parseInt(document.getElementById('ccSettingsMaxBet').value) || 1000;
        sfSave('cc_settings', cfg);
        sfToast('Settings saved!', 'success');
    });
}



// ═══════════════════════════════════════════
// PAGE: GIFT CATALOG
// ═══════════════════════════════════════════
function pageGiftCatalog() {
    return `<div class="page-header"><h1><i class="fa-solid fa-book"></i> Gift Catalog</h1>
        <p>Browse all available TikTok gifts with their diamond values and animations.</p>
    </div>
    <div class="page-body">
        <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">
            <div style="position:relative;flex:1"><i class="fa-solid fa-magnifying-glass" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px"></i>
            <input class="form-input" id="gcSearch" placeholder="Search gifts..." style="padding-left:32px;font-size:12px"></div>
            <select class="form-select" id="gcSort" style="width:140px;font-size:12px">
                <option value="name">Name</option>
                <option value="diamonds">Diamonds</option>
            </select>
        </div>
        <div id="gcGrid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px">
            <div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading gifts...</div>
        </div>
    </div>`;
}
function initGiftCatalog() {
    var allGifts = [];
    fetch('/api/tiktok/gifts').then(function(r){return r.json();}).then(function(d) {
        allGifts = Array.isArray(d) ? d : (d.gifts || []);
        renderGifts();
    }).catch(function() {
        document.getElementById('gcGrid').innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-muted)">Could not load gifts. Connect to TikTok first.</div>';
    });
    function renderGifts() {
        var q = (document.getElementById('gcSearch').value || '').toLowerCase().trim();
        var sort = document.getElementById('gcSort').value;
        var filtered = allGifts.filter(function(g) { return !q || (g.name||'').toLowerCase().includes(q); });
        if (sort === 'diamonds') filtered.sort(function(a,b){return (b.diamondCount||0)-(a.diamondCount||0);});
        else filtered.sort(function(a,b){return (a.name||'').localeCompare(b.name||'');});
        var grid = document.getElementById('gcGrid');
        if (!filtered.length) { grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:20px;color:var(--text-muted)">No gifts found</div>'; return; }
        grid.innerHTML = filtered.map(function(g) {
            return '<div class="settings-section" style="padding:10px;text-align:center">' +
                (g.image ? '<img src="'+g.image+'" style="width:48px;height:48px;object-fit:contain;margin-bottom:4px">' : '<div style="font-size:32px;margin-bottom:4px">🎁</div>') +
                '<div style="font-size:12px;font-weight:600;color:var(--white);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + (g.name||'Gift') + '</div>' +
                '<div style="font-size:11px;color:var(--yellow)">💎 ' + (g.diamondCount||0) + '</div></div>';
        }).join('');
    }
    document.getElementById('gcSearch').addEventListener('input', renderGifts);
    document.getElementById('gcSort').addEventListener('change', renderGifts);
}

// ═══════════════════════════════════════════
// PAGE: DEVELOPER API
// ═══════════════════════════════════════════
function pageDAPI() {
    return `<div class="page-header"><h1><i class="fa-solid fa-code"></i> Developer API</h1>
        <p>Access the StreamFinity API for custom integrations and automation.</p>
    </div>
    <div class="page-body">
        <div class="settings-section">
            <h3><i class="fa-solid fa-link"></i> API Base URL</h3>
            <div class="form-group"><input class="form-input" type="text" value="${location.origin}/api" readonly onclick="this.select()"></div>
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-list"></i> Available Endpoints</h3>
            ${[
                { method:'GET', path:'/api/tiktok/status', desc:'Current TikTok connection status and stats' },
                { method:'GET', path:'/api/tiktok/events', desc:'Recent TikTok events (chat, gifts, follows, etc.)' },
                { method:'GET', path:'/api/viewers', desc:'Paginated viewer list with points and levels' },
                { method:'GET', path:'/api/viewers/stats/summary', desc:'Viewer stats summary' },
                { method:'GET', path:'/api/actions', desc:'List all configured actions' },
                { method:'GET', path:'/api/events', desc:'List all configured event triggers' },
                { method:'GET', path:'/api/goals', desc:'List all goals' },
                { method:'POST', path:'/api/simulate', desc:'Simulate a TikTok event' },
                { method:'GET', path:'/api/crowdcontrol/games', desc:'List all CrowdControl games' },
                { method:'GET', path:'/health', desc:'Server health check' },
            ].map(function(e) {
                return '<div class="settings-row" style="padding:8px 0"><div class="settings-row-info"><div class="settings-row-label"><span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:700;background:'+(e.method==='GET'?'rgba(16,185,129,.15);color:var(--green)':'rgba(59,130,246,.15);color:var(--blue)')+'">' + e.method + '</span> <code style="font-size:12px;color:var(--accent)">' + e.path + '</code></div><div class="settings-row-desc">' + e.desc + '</div></div></div>';
            }).join('')}
        </div>
        <div class="settings-section">
            <h3><i class="fa-solid fa-plug"></i> WebSocket</h3>
            <p style="color:var(--text-dim);font-size:12px">Connect to <code style="color:var(--accent)">${location.origin.replace('http','ws')}/ws</code> for real-time events.</p>
        </div>
    </div>`;
}

// ═══════════════════════════════════════════
// PAGE: TRANSACTIONS
// ═══════════════════════════════════════════
function pageTransactions() {
    return `<div class="page-header"><h1><i class="fa-solid fa-receipt"></i> Transactions</h1>
        <p>View all point transactions and gift history.</p>
    </div>
    <div class="page-body">
        <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">
            <select class="form-select" id="txFilter" style="width:140px;font-size:12px">
                <option value="">All Types</option>
                <option value="gift">Gifts</option>
                <option value="manual">Manual</option>
                <option value="chat">Chat</option>
                <option value="follow">Follow</option>
            </select>
            <div style="position:relative;flex:1"><i class="fa-solid fa-magnifying-glass" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:12px"></i>
            <input class="form-input" id="txSearch" placeholder="Search by username..." style="padding-left:32px;font-size:12px"></div>
            <button class="btn btn-sm" id="txRefresh"><i class="fa-solid fa-rotate"></i></button>
        </div>
        <div class="settings-section" style="padding:0;overflow:hidden">
            <div style="max-height:500px;overflow-y:auto">
                <table class="data-table" style="width:100%">
                    <thead><tr style="position:sticky;top:0;background:var(--surface);z-index:1"><th>Time</th><th>User</th><th>Type</th><th>Amount</th><th>Details</th></tr></thead>
                    <tbody id="txBody"><tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text-muted)"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr></tbody>
                </table>
            </div>
        </div>
    </div>`;
}
function initTransactions() {
    function loadTx() {
        var search = document.getElementById('txSearch').value.trim();
        var url = '/api/viewers?limit=50&sort=last_seen';
        if (search) url += '&search=' + encodeURIComponent(search);
        fetch(url).then(function(r){return r.json();}).then(function(d) {
            var viewers = d.viewers || [];
            var body = document.getElementById('txBody');
            if (!viewers.length) { body.innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text-muted)">No transactions found</td></tr>'; return; }
            body.innerHTML = viewers.map(function(v) {
                return '<tr style="border-bottom:1px solid var(--border)">' +
                    '<td style="padding:7px 12px;font-size:12px;color:var(--text-muted)">' + (v.last_seen ? new Date(v.last_seen).toLocaleString() : '--') + '</td>' +
                    '<td style="padding:7px 12px;font-weight:600">@' + (v.unique_id||'?') + '</td>' +
                    '<td style="padding:7px 12px"><span style="font-size:11px;padding:2px 6px;border-radius:4px;background:var(--accent-bg);color:var(--accent)">viewer</span></td>' +
                    '<td style="padding:7px 12px;color:var(--yellow);font-weight:600">' + (v.points||0).toLocaleString() + ' pts</td>' +
                    '<td style="padding:7px 12px;font-size:12px;color:var(--text-dim)">' + (v.total_gifts||0) + ' gifts, ' + (v.total_chats||0) + ' chats</td></tr>';
            }).join('');
        }).catch(function() {
            document.getElementById('txBody').innerHTML = '<tr><td colspan="5" style="padding:20px;text-align:center;color:var(--text-muted)">Failed to load</td></tr>';
        });
    }
    loadTx();
    document.getElementById('txFilter').addEventListener('change', loadTx);
    document.getElementById('txSearch').addEventListener('input', function() { clearTimeout(this._t); this._t = setTimeout(loadTx, 300); });
    document.getElementById('txRefresh').addEventListener('click', loadTx);
}

// ═══════════════════════════════════════════
// LIVE EVENT LOG (Dashboard feed)
// ═══════════════════════════════════════════
let liveEventLog = [];
function addLiveEvent(ev) {
    liveEventLog.push(ev);
    if (liveEventLog.length > 200) liveEventLog.shift();
    const feed = document.getElementById('sfLiveFeed');
    if (feed) {
        const div = document.createElement('div');
        div.className = 'live-event live-event-' + ev.type;
        div.innerHTML = ev.html;
        feed.prepend(div);
        while (feed.children.length > 50) feed.lastChild.remove();
    }
}


// ═══════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
