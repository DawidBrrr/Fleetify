local hmac_lib = require "resty.hmac"
local resty_string = require "resty.string"
local secret = os.getenv("INTERNAL_HMAC_SECRET")
local request_id = ngx.var.request_id

ngx.req.read_body()
local body = ngx.req.get_body_data()

if not body then
    ngx.log(ngx.ERR, "Body is nil or empty")
    body = "{}"
else
    ngx.log(ngx.ERR, "Body content: " .. body)
end

if not secret then
    ngx.log(ngx.ERR, "INTERNAL_HMAC_SECRET not set")
    return
end

local hmac = hmac_lib:new(secret, hmac_lib.ALG_SHA256)
if not hmac then
    ngx.log(ngx.ERR, "Failed to create hmac object")
    return
end

local signature = hmac:final(body)
local signature_hex = resty_string.to_hex(signature)

ngx.req.set_header("X-Gateway-Signature", signature_hex)
ngx.req.set_header("X-Request-ID", request_id)
if not ngx.req.get_headers()["Content-Type"] then
    ngx.req.set_header("Content-Type", "application/json")
end
