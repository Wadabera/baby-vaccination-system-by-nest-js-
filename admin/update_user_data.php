<?php
// Start session
session_start();

// Database connection
define("HOST", "localhost");
define("USERNAME", "root");
define("DB", "webproject");
define("PASSWORD", "");
define('HOMEURL', "http://localhost/Web%20project/");

// Establish connection
$conn = mysqli_connect(HOST, USERNAME, PASSWORD, DB);

if (!$conn) {
    die("Database Connection Failed: " . mysqli_connect_error());
}

// Check if form is submitted
if (isset($_POST['updateuser'])) {
    // Fetch form data
    $id = $_POST['id'];
    $username = $_POST['username'];
    $role = $_POST['role'];
    $f_name = $_POST['f_name'];
    $m_name = $_POST['m_name'];
    $l_name = $_POST['l_name'];
    $phone_number = $_POST['phone_number'];
    $email = $_POST['email'];

    // Fetch old image name from DB (if exists)
    $query1 = "SELECT image_url FROM `users` WHERE user_id='$id'";
    $result1 = mysqli_query($conn, $query1);
    
    if (!$result1 || mysqli_num_rows($result1) == 0) {
        $_SESSION["add"] = "User not found!";
        header("Location: " . HOMEURL . "admin/users.php");
        exit();
    }
    
    $row = mysqli_fetch_assoc($result1);
    $old_image = $row['image_url'];

    // Handle new image upload (if any)
    $image_name = $old_image; // Keep old image by default

    if (!empty($_FILES['image']['name'])) {
        $image_name = $_FILES['image']['name'];
        $image_tmp = $_FILES['image']['tmp_name'];
        $image_destination = "../images/users/" . $image_name;

        // Move new image to directory
        if (move_uploaded_file($image_tmp, $image_destination)) {
            // Delete old image if it exists
            $old_image_path = "../images/users/" . $old_image;
            if (!empty($old_image) && file_exists($old_image_path)) {
                unlink($old_image_path);
            }
        } else {
            $_SESSION["add"] = "Failed to upload image";
            header("Location: " . HOMEURL . "admin/users.php");
            exit();
        }
    }

    // Update user details in the database
    $query = "UPDATE `users` SET 
                f_name='$f_name', 
                m_name='$m_name', 
                l_name='$l_name', 
                username='$username', 
                phone_number='$phone_number', 
                email='$email', 
                role='$role',
                image_url='$image_name'
              WHERE user_id='$id'";

    $result = mysqli_query($conn, $query);

    // Check update result
    if ($result) {
        $_SESSION["add"] = "$username successfully updated";
        header("Location: " . HOMEURL . "admin/users.php");
        exit();
    } else {
        $_SESSION["add"] = "Failed to update $username";
        header("Location: " . HOMEURL . "admin/update_user.php?id=$id");
        exit();
    }
}

// Include the header for the admin page
include("./parts/header.php");

// Include footer at the end
include("./parts/footer.php");
?>
