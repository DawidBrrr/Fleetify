local api_keys_str = os.getenv("GATEWAY_API_KEYS")
local request_key = ngx.req.get_headers()["X-API-Key"]
local auth_header = ngx.req.get_headers()["Authorization"]

-- Strategia autoryzacji:
-- 1. Bearer token (frontend) - przepuść, downstream service zwaliduje JWT
-- 2. API key (backend-to-backend) - waliduj tutaj
-- 3. Brak obu - odmów dostępu

-- Jeśli jest Bearer token - przepuść (frontend request)
if auth_header and string.sub(auth_header, 1, 7) == "Bearer " then
    return
end

-- Jeśli jest API key - waliduj (backend-to-backend)
if request_key then
    if not api_keys_str or not string.find("," .. api_keys_str .. ",", "," .. request_key .. ",") then
        ngx.status = 403
        ngx.header.content_type = "application/json"
        ngx.say('{"message": "Invalid API key"}')
        ngx.exit(403)
    end
    return
end

-- Brak autoryzacji
ngx.status = 401
ngx.header.content_type = "application/json"
ngx.say('{"message": "Authorization required"}')
ngx.exit(401)
