from flask import Flask, jsonify, render_template, request
import ipaddress
import socket

app = Flask(__name__)

WORDLIST = [
    "www", "mail", "api", "dev", "test",
    "admin", "blog", "ftp", "portal", "support",
]


def validate_domain(value):
    domain = value.strip().lower().rstrip(".")
    if not domain or len(domain) > 253 or " " in domain:
        return None
    try:
        ipaddress.ip_address(domain)
    except ValueError:
        labels = domain.split(".")
        if len(labels) < 2 or any(
            not label or label.startswith("-") or label.endswith("-")
            or not all(char.isalnum() or char == "-" for char in label)
            for label in labels
        ):
            return None
    else:
        return None
    return domain


def resolve_subdomain(subdomain):
    try:
        addresses = socket.gethostbyname_ex(subdomain)[2]
        return {"subdomain": subdomain, "status": "Found", "ip": ", ".join(addresses)}
    except (socket.gaierror, socket.herror, socket.timeout, OSError):
        return {"subdomain": subdomain, "status": "Not Found", "ip": "-"}


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/enumerate")
def enumerate_subdomains():
    payload = request.get_json(silent=True) or {}
    domain = validate_domain(str(payload.get("domain", "")))
    if not domain:
        return jsonify({"error": "Enter a valid domain such as example.com."}), 400

    results = [resolve_subdomain(f"{prefix}.{domain}") for prefix in WORDLIST]
    found = sum(result["status"] == "Found" for result in results)
    return jsonify({
        "domain": domain,
        "total": len(results),
        "found": found,
        "not_found": len(results) - found,
        "results": results,
    })


if __name__ == "__main__":
    app.run(debug=True)
