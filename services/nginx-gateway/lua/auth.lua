local api_keys_str = os.getenv("GATEWAY_API_KEYS")
local request_key = ngx.req.get_headers()["X-API-Key"]

if not request_key then
    ngx.status = 401
    ngx.header.content_type = "application/json"
    ngx.say('{"message": "API key required"}')
    ngx.exit(401)
end

if not api_keys_str or not string.find("," .. api_keys_str .. ",", "," .. request_key .. ",") then
    ngx.status = 403
    ngx.header.content_type = "application/json"
    ngx.say('{"message": "Invalid API key"}')
    ngx.exit(403)
end
