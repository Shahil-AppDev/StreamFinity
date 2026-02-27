/**
 * WebSocket request handler for StreamerBot-compatible API
 */

function handleWSRequest(ws, data, log, broadcast) {
    const { request, id } = data;
    const ok = (payload) => ws.send(JSON.stringify({ status: 'ok', id, ...payload }));

    switch (request) {
        case 'GetInfo':
            ok({ info: { instanceId: 'streamfinity-server', name: 'StreamFinity Server', version: '1.0.0', os: process.platform, connected: true } });
            break;
        case 'GetActions':
            ok({ actions: [
                { id: 'sf-pro-bypass', name: 'StreamFinity Pro Bypass', enabled: true },
                { id: 'sf-overlay-trigger', name: 'Trigger Overlay', enabled: true },
                { id: 'sf-chat-relay', name: 'Chat Relay', enabled: true },
                { id: 'sf-alert-trigger', name: 'Trigger Alert', enabled: true },
                { id: 'sf-game-start', name: 'Start Game', enabled: true },
                { id: 'sf-poll-create', name: 'Create Poll', enabled: true }
            ], count: 6 });
            break;
        case 'DoAction':
            log.info(`[WS] DoAction: ${data.action?.name || data.action?.id}`);
            ok({});
            broadcast(ws, { event: { source: 'StreamFinity', type: 'ActionExecuted' }, data: data.action });
            break;
        case 'Subscribe':
        case 'UnSubscribe':
            ok({ events: data.events || {} });
            break;
        case 'GetBroadcaster':
            ok({ platforms: { tiktok: { broadcastUser: 'StreamFinityPro', broadcastUserId: 'sf-server' } }, connected: ['tiktok'], disconnected: [] });
            break;
        case 'SendMessage':
            log.info(`[WS] SendMessage (${data.platform}): ${data.message}`);
            ok({});
            broadcast(ws, { event: { source: 'StreamFinity', type: 'MessageSent' }, data: { platform: data.platform, message: data.message } });
            break;
        case 'ExecuteCodeTrigger':
            log.info(`[WS] CodeTrigger: ${data.triggerName}`);
            ok({});
            break;
        case 'GetActiveViewers':
            ok({ count: 0, viewers: [] });
            break;
        case 'GetCommands':
            ok({ commands: [], count: 0 });
            break;
        case 'GetCredits':
            ok({ credits: {} });
            break;
        case 'GetGlobals':
            ok({ variables: [] });
            break;
        case 'GetEvents':
            ok({ events: { General: ['Custom'], StreamFinity: ['ChatMessage', 'Gift', 'Follow', 'ActionExecuted'], Command: ['Triggered'] } });
            break;
        case 'GetCodeTriggers':
            ok({ count: 0, triggers: [] });
            break;
        default:
            ok({});
            break;
    }
}

module.exports = handleWSRequest;
