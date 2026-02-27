#!/bin/bash
# ============================================================
# StreamFinity - Server Diagnostic Script
# Run this on live.starline-agency.xyz (77.42.34.90) via SSH
#
# Usage: bash server-check.sh
# ============================================================

echo "=========================================="
echo "  StreamFinity Server Diagnostic"
echo "  Host: $(hostname) / $(hostname -I | awk '{print $1}')"
echo "  Date: $(date)"
echo "=========================================="
echo ""

# ── 1. Check which ports are in use ──
echo "── 1. PORTS IN USE ──"
echo ""
ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null
echo ""

# ── 2. Check common streaming ports ──
echo "── 2. KEY PORTS STATUS ──"
echo ""
PORTS=(80 443 3000 3001 4444 8080 8081 8090 8443 9090 21213)
for PORT in "${PORTS[@]}"; do
    RESULT=$(ss -tlnp "sport = :$PORT" 2>/dev/null | grep -v "State")
    if [ -n "$RESULT" ]; then
        PROC=$(echo "$RESULT" | grep -oP 'users:\(\("\K[^"]+')
        echo "  Port $PORT: IN USE ($PROC)"
    else
        echo "  Port $PORT: AVAILABLE"
    fi
done
echo ""

# ── 3. Check if Streamer.bot is running ──
echo "── 3. STREAMER.BOT PROCESS ──"
echo ""
SB_PROC=$(ps aux 2>/dev/null | grep -i "[s]treamer" || tasklist 2>/dev/null | grep -i "streamer")
if [ -n "$SB_PROC" ]; then
    echo "  Streamer.bot FOUND:"
    echo "  $SB_PROC"
else
    echo "  Streamer.bot NOT FOUND in running processes"
    echo "  Check if it runs as a Windows service or under a different name"
fi
echo ""

# ── 4. Check WebSocket connectivity ──
echo "── 4. WEBSOCKET CONNECTIVITY TEST ──"
echo ""
for PORT in 8080 8090; do
    if command -v websocat &> /dev/null; then
        RESULT=$(echo '{"request":"GetInfo","id":"test"}' | timeout 3 websocat "ws://127.0.0.1:$PORT/" 2>/dev/null)
        if [ -n "$RESULT" ]; then
            echo "  ws://127.0.0.1:$PORT/ → RESPONDING"
            echo "  Response: $RESULT"
        else
            echo "  ws://127.0.0.1:$PORT/ → NO RESPONSE"
        fi
    elif command -v curl &> /dev/null; then
        RESULT=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "http://127.0.0.1:$PORT/" 2>/dev/null)
        if [ "$RESULT" != "000" ]; then
            echo "  http://127.0.0.1:$PORT/ → HTTP $RESULT (port active)"
        else
            echo "  http://127.0.0.1:$PORT/ → NO RESPONSE"
        fi
    else
        echo "  (websocat/curl not available, skipping WS test on port $PORT)"
    fi
done
echo ""

# ── 5. Check existing projects/services ──
echo "── 5. RUNNING SERVICES ──"
echo ""
# Docker
if command -v docker &> /dev/null; then
    echo "  Docker containers:"
    docker ps --format "    {{.Names}} → {{.Ports}}" 2>/dev/null || echo "    (docker not accessible)"
    echo ""
fi
# PM2
if command -v pm2 &> /dev/null; then
    echo "  PM2 processes:"
    pm2 list 2>/dev/null || echo "    (pm2 not accessible)"
    echo ""
fi
# Systemd services (common ones)
if command -v systemctl &> /dev/null; then
    echo "  Key systemd services:"
    for SVC in nginx apache2 httpd caddy node streamerbot; do
        STATUS=$(systemctl is-active $SVC 2>/dev/null)
        if [ "$STATUS" = "active" ]; then
            echo "    $SVC: ACTIVE"
        fi
    done
    echo ""
fi

# ── 6. Firewall rules ──
echo "── 6. FIREWALL (ports open to outside) ──"
echo ""
if command -v ufw &> /dev/null; then
    ufw status 2>/dev/null | head -20
elif command -v iptables &> /dev/null; then
    iptables -L INPUT -n 2>/dev/null | head -20
else
    echo "  (no firewall tool found)"
fi
echo ""

# ── 7. Disk & memory ──
echo "── 7. RESOURCES ──"
echo ""
echo "  Disk:"
df -h / 2>/dev/null | tail -1 | awk '{print "    Used: "$3" / "$2" ("$5" full)"}'
echo "  Memory:"
free -h 2>/dev/null | grep Mem | awk '{print "    Used: "$3" / "$2}'
echo ""

# ── 8. Recommended port for StreamFinity ──
echo "── 8. RECOMMENDATION ──"
echo ""
echo "  Suggested ports for StreamFinity:"
echo "    StreamerBot WS:  8090 (if not already used)"
echo "    StreamFinity WS:  8091 (internal websocket)"
echo "    StreamFinity API: 8092 (internal API)"
echo ""
echo "  If port 8090 is taken, try: 9090, 9091, 18080"
echo ""
echo "=========================================="
echo "  Diagnostic complete. Share this output."
echo "=========================================="
