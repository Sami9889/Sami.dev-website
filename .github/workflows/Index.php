<?php
session_start();

// ---------------- CONFIG ----------------
$DB_HOST = "localhost";
$DB_USER = "root";
$DB_PASS = "password"; // change this
$DB_NAME = "sami_dev";
$LOG_FILE = "visits.log";

// ---------------- DB CONNECTION ----------------
$mysqli = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME);
if ($mysqli->connect_error) die("DB Connection Failed: " . $mysqli->connect_error);

// ---------------- VISITOR INFO ----------------
$user_ip = $_SERVER['REMOTE_ADDR'];
$user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';
$page_visited = $_SERVER['REQUEST_URI'] ?? '/';
$referrer = $_SERVER['HTTP_REFERER'] ?? null;

// ---------------- GET LOCATION ----------------
$location = "Unknown";
$geo = @file_get_contents("http://ip-api.com/json/$user_ip");
if ($geo) {
    $geo_data = json_decode($geo, true);
    if ($geo_data['status'] === 'success') {
        $location = $geo_data['city'] . ", " . $geo_data['regionName'] . ", " . $geo_data['country'];
    }
}

// ---------------- CHECK BANNED ----------------
$stmt = $mysqli->prepare("SELECT * FROM bans WHERE user_ip=? AND (expires_at IS NULL OR expires_at > NOW())");
$stmt->bind_param("s", $user_ip);
$stmt->execute();
$banned = $stmt->get_result()->fetch_assoc();

if ($banned && !isset($_GET['admin'])) {
    echo "<!DOCTYPE html>
    <html lang='en'>
    <head><meta charset='UTF-8'><title>Banned</title>
    <style>
        body { background:#111; color:#f00; font-family:Arial; text-align:center; margin-top:20%; }
        h1 { font-size:3em; }
        p { font-size:1.5em; }
    </style>
    </head>
    <body>
        <h1>🚫 You are banned!</h1>
        <p>Your IP ($user_ip) has been blocked.</p>
        <p>Reason: {$banned['reason']}</p>
    </body>
    </html>";
    exit;
}

// ---------------- LOG VISIT ----------------
$stmt = $mysqli->prepare("CALL AddVisit(?,?,?,?,?)");
$stmt->bind_param("sssss", $user_ip, $location, $user_agent, $page_visited, $referrer);
$stmt->execute();

// Optional JSON log
$logEntry = [
    'ip' => $user_ip,
    'location' => $location,
    'user_agent' => $user_agent,
    'page' => $page_visited,
    'referrer' => $referrer,
    'time' => date("c")
];
file_put_contents($LOG_FILE, json_encode($logEntry).PHP_EOL, FILE_APPEND);

// ---------------- ADMIN LOGIN ----------------
if (isset($_POST['admin_user'], $_POST['admin_pass'])) {
    $username = $_POST['admin_user'];
    $password = $_POST['admin_pass'];
    $stmt = $mysqli->prepare("SELECT * FROM admins WHERE username=?");
    $stmt->bind_param("s", $username);
    $stmt->execute();
    $res = $stmt->get_result()->fetch_assoc();
    if ($res && password_verify($password, $res['password_hash'])) {
        $_SESSION['admin'] = $username;
    } else {
        $login_error = "Invalid username or password.";
    }
}

// ---------------- ADMIN PANEL ----------------
if (strpos($_SERVER['REQUEST_URI'], '/admin') === 0) {

    if (!isset($_SESSION['admin'])) {
        echo "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>Admin Login</title>
        <style>
            body { font-family: Arial; background: #222; color: #fff; display:flex; justify-content:center; align-items:center; height:100vh; }
            .login { background:#333; padding:30px; border-radius:10px; text-align:center; }
            input { margin:5px 0; padding:10px; width:200px; border-radius:5px; border:none; }
            button { padding:10px 20px; margin-top:10px; border:none; border-radius:5px; background:#f90; color:#111; font-weight:bold; cursor:pointer; }
            .error { color:red; margin-bottom:10px; }
        </style>
        </head><body>
        <div class='login'>
            <h2>Admin Login</h2>";
        if (!empty($login_error)) echo "<div class='error'>$login_error</div>";
        echo "<form method='post'>
            <input name='admin_user' placeholder='Username' required><br>
            <input name='admin_pass' type='password' placeholder='Password' required><br>
            <button>Login</button>
        </form>
        </div></body></html>";
        exit;
    }

    // Ban user
    if (isset($_POST['ban_ip'], $_POST['reason'])) {
        $stmt = $mysqli->prepare("CALL BanUser(?,?,?)");
        $stmt->bind_param("sss", $_POST['ban_ip'], $_POST['reason'], $_SESSION['admin']);
        $stmt->execute();
    }

    // Unban user
    if (isset($_GET['unban'])) {
        $stmt = $mysqli->prepare("CALL UnbanUser(?)");
        $stmt->bind_param("s", $_GET['unban']);
        $stmt->execute();
    }

    // ---------------- ADMIN HTML ----------------
    echo "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>Admin Panel</title>
    <style>
        body { font-family: Arial; background:#111; color:#fff; padding:20px; }
        h1, h2 { color:#f90; }
        table { width:100%; border-collapse:collapse; margin-bottom:20px; }
        th, td { border:1px solid #555; padding:8px; text-align:left; }
        th { background:#333; }
        tr:nth-child(even) { background:#222; }
        input { padding:5px; margin-right:5px; border-radius:5px; border:none; }
        button { padding:5px 10px; border:none; border-radius:5px; background:#f90; color:#111; cursor:pointer; }
        a { color:#f90; text-decoration:none; }
    </style>
    </head><body>
    <h1>Admin Panel – Sami.is-a.dev</h1>";

    // Ban form
    echo "<h2>Ban an IP</h2>
    <form method='post'>
        <input name='ban_ip' placeholder='IP Address' required>
        <input name='reason' placeholder='Reason' required>
        <button>Ban</button>
    </form>";

    // Banned users
    echo "<h2>Banned Users</h2><table><tr><th>IP</th><th>Reason</th><th>Banned By</th><th>Banned At</th><th>Action</th></tr>";
    $res = $mysqli->query("SELECT * FROM bans ORDER BY banned_at DESC");
    while ($row = $res->fetch_assoc()) {
        echo "<tr>
            <td>{$row['user_ip']}</td>
            <td>{$row['reason']}</td>
            <td>{$row['banned_by']}</td>
            <td>{$row['banned_at']}</td>
            <td><a href='/admin?unban={$row['user_ip']}'>Unban</a></td>
        </tr>";
    }
    echo "</table>";

    // Recent visits
    echo "<h2>Recent Visits</h2><table><tr><th>IP</th><th>Location</th><th>User Agent</th><th>Page</th><th>Referrer</th><th>Time</th></tr>";
    $res = $mysqli->query("SELECT * FROM visits ORDER BY visited_at DESC LIMIT 50");
    while ($row = $res->fetch_assoc()) {
        echo "<tr>
            <td>{$row['user_ip']}</td>
            <td>{$row['location']}</td>
            <td>{$row['user_agent']}</td>
            <td>{$row['page_visited']}</td>
            <td>{$row['referrer']}</td>
            <td>{$row['visited_at']}</td>
        </tr>";
    }
    echo "</table></body></html>";
    exit;
}

// ---------------- NORMAL VISITOR PAGE ----------------
echo "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><title>Welcome</title></head>
<body><h1>Welcome to Sami.is-a.dev 🚀</h1>
<p>Your visit has been logged. Your IP: $user_ip, Location: $location</p>
</body></html>";
?>
