<?php
// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Database Connection
define("HOST", "localhost");
define("USERNAME", "root");
define("PASSWORD", "");
define("DB", "webproject");
define("HOMEURL", "http://localhost/Web%20project/");

$conn = mysqli_connect(HOST, USERNAME, PASSWORD, DB);
if (!$conn) {
    die("Database Connection Failed: " . mysqli_connect_error());
}

// Ensure ID and username are set
if (!isset($_GET['id']) || !isset($_GET['username'])) {
    die("Invalid request: Missing parameters.");
}

$id = $_GET['id'];
$username = $_GET['username'];

// Fetch user details
$query1 = "SELECT image_url FROM `users` WHERE user_id='$id'";
$result1 = mysqli_query($conn, $query1);
if (!$result1 || mysqli_num_rows($result1) == 0) {
    die("User not found.");
}

$row = mysqli_fetch_assoc($result1);
$image_url = $row['image_url'];

// Move image to backup before deleting user
$sourceDirectory = '../images/users/';
$backupDirectory = '../backup/images/users/';
$sourcePath = $sourceDirectory . $image_url;
$backupPath = $backupDirectory . $image_url;

// Ensure backup directory exists
if (!is_dir($backupDirectory)) {
    mkdir($backupDirectory, 0777, true);
}

// Move image if it exists
if (!empty($image_url) && file_exists($sourcePath)) {
    rename($sourcePath, $backupPath);
}

// Delete user from database
$query2 = "DELETE FROM `users` WHERE user_id='$id'";
$result2 = mysqli_query($conn, $query2);

if ($result2) {
    $_SESSION["add"] = "$username deleted successfully";
} else {
    $_SESSION["add"] = "Failed to delete $username";
}

// Redirect back to users page
header("Location: " . HOMEURL . "admin/users.php");
exit();
?>
