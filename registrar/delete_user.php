<?php
// Start output buffering to prevent headers already sent errors
ob_start();

// Include the header
include("./parts/header.php");

// Find id and first name from the URL parameters
$id = $_GET['id'];
$fname = $_GET['fname'];

// Fetch the mother's photo URL from the database
$query1 = "SELECT * FROM `webproject`.`mother_table` WHERE m_id='$id'";
$result1 = mysqli_query($conn, $query1) or die(mysqli_error($conn));
$rows1 = mysqli_num_rows($result1);

// Fetch the photo URL if the record exists
$photo_url = '';
if ($rows1 > 0) {
    $rows1 = mysqli_fetch_assoc($result1);
    $photo_url = $rows1['photo_url'];
}

$sourceDirectory = '../images/mother/';
$destinationDirectory = '../backup/image/mother/';
$imageName = $photo_url;

$sourcePath = $sourceDirectory . $imageName;
$destinationPath = $destinationDirectory . $imageName;

// Check if the source file exists before trying to move it
if (file_exists($sourcePath)) {
    // Move the file to the backup directory
    if (rename($sourcePath, $destinationPath)) {
        // Image moved successfully
        $_SESSION["add"] = $fname . "'s image moved to backup.";
    } else {
        // Failed to move the image
        $_SESSION["add"] = "Failed to move the image.";
    }
} else {
    // Source image doesn't exist
    $_SESSION["add"] = "Source image does not exist.";
}

// Now delete the record from the database
$query = "DELETE FROM `webproject`.`mother_table` WHERE m_id='$id'";
$result = mysqli_query($conn, $query) or die(mysqli_error($conn));

// If the delete was successful, set a success message
if ($result) {
    $_SESSION["add"] = $fname . " deleted successfully.";
    header("Location:" . HOMEURL . "registrar/mother.php");  // Redirect to the mother list page
    exit();  // Ensure no further code is executed
} else {
    // If the delete failed, set an error message
    $_SESSION["add"] = "Failed to delete " . $fname . ".";
}

// If there's an error or redirection, we can display an alert
if (isset($_SESSION['add'])) {
    echo "<script>alert('" . $_SESSION['add'] . "');</script>";
    unset($_SESSION['add']);
}

// Include the footer
include("./parts/footer.php");

// End output buffering
ob_end_flush();
?>
