<?php
ob_start();  // Start output buffering

include("./parts/header.php");

// Get the parameters
$id = $_GET['id'];
$fname = $_GET['fname'];

// Delete from DB
$query = "DELETE FROM `webproject`.`child_table` WHERE c_id = '$id'";
$result = mysqli_query($conn, $query) or die(mysqli_error($conn));

if ($result == True) {
    $_SESSION["add"] = $fname . " deleted successfully";
    header("Location:" . HOMEURL . "registrar/children.php");
    exit();  // Ensure no further code runs after header
} else {
    $_SESSION["add"] = "Failed to delete";
    if (isset($_SESSION['add'])) {
        echo "<h1 class='error'>" . $_SESSION['add'] . "</h1>";
        unset($_SESSION['add']);
    }
}

ob_end_flush();  // End output buffering and send output

?>

<?php include("./parts/footer.php"); ?>
