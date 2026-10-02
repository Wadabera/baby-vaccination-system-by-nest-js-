<?php

if (isset($_POST['updatepass'])) {
    $currentpassword = $_POST['currentpassword'];
    $newpassword = $_POST['newpassword'];
    $copassword = $_POST['copassword'];
    print('<pre>');
    print_r($_POST);
    die();
    // Validate current password
    if (empty($currentpassword)) {
        $errors[] = "Current password is required.";
    }

    // Validate new password
    if (empty($newpassword)) {
        $errors[] = "New password is required.";
    } elseif (!preg_match("/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/", $newpassword)) {
        $errors[] = "New password must be at least 8 characters long and contain at least one letter and one number.";
    }

    // Validate confirm password
    if (empty($copassword)) {
        $errors[] = "Confirm password is required.";
    } elseif ($newpassword !== $copassword) {
        $errors[] = "New password and confirm password do not match.";
    }

    if (empty($errors)) {
        // Password validation passed, proceed with updating the password
        $query1 = "SELECT password from webproject.users where user_id='$id'";
        $result1 = mysqli_query($conn, $query1) or die(mysqli_error($conn));
        $rows1 = mysqli_num_rows($result1);

        if ($rows1 > 0) {
            while ($rows = mysqli_fetch_assoc($result1)) {
                $password = md5($rows['password']);
            }
        }

        if ($currentpassword == $password) {
            $newPasswordHash = md5($newpassword);

            $query = "UPDATE `webproject`.`users` SET password ='$newPasswordHash' WHERE user_id='$id'";
            $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

            if ($result) {
                $_SESSION["add"] = "Password updated successfully.";
                // header("Location:".HOMEURL."admin/users.php");
            } else {
                $_SESSION["add"] = "Failed to update the password.";
            }
        } else {
            $errors[] = "Incorrect current password.";
        }
    }
}

?>

if (!empty($errors)) {
    echo '<div class="alert alert-danger"><ul>';
    foreach ($errors as $error) {
        echo '<li>' . $error . '</li>';
    }
    echo '</ul></div>';
}