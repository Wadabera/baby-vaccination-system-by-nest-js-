<?php
session_start();
define("HOST", "localhost");
define("USERNAME", "root");
define("DB", "webproject");
define("PASSWORD", "");
define('HOMEURL', "http://localhost/Web%20project/");
define('homeServerLocation', realpath($_SERVER["DOCUMENT_ROOT"]));
$conn = mysqli_connect(HOST, USERNAME, PASSWORD, DB, '3306') or die(mysqli_error($conn));
$db_select = mysqli_select_db($conn, DB) or die(mysqli_error($conn));
