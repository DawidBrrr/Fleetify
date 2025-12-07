local api_keys_str = os.getenv("GATEWAY_API_KEYS")
local request_key = ngx.req.get_headers()["X-API-Key"]
local auth_header = ngx.req.get_headers()["Authorization"]

-- If Authorization header is present, we might want to validate it or extract user info
-- For now, we'll assume the downstream service (user-management) handles token validation
-- But if we want to pass user ID to other services, we need to validate it here or call user-management

-- However, for this architecture, let's assume the token is passed downstream
-- and the downstream service (dashboard-service) will extract the user ID from the token
-- OR we can have the gateway call user-management to validate token and get user ID

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
