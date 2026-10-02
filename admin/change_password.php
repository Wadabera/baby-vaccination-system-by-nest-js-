<?php
include("./parts/header.php");
$id = $_GET['id'];
$errors = array();

if (isset($_POST['updatepass'])) {
    $currentpassword = md5($_POST['currentpassword']);
    $newpassword = md5($_POST['newpassword']);
    $copassword = md5($_POST['copassword']);

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
        $query = "SELECT password from webproject.users where user_id='$id'";
        $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
        $rows = mysqli_num_rows($result);

        if ($rows > 0) {
            while ($rows = mysqli_fetch_assoc($result)) {
                $password = $rows['password'];
            }
        }

        if ($currentpassword == $password) {
            $newPasswordHash = $newpassword;
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

<script>
    function validateForm() {
        var currentpassword = document.forms["passwordForm"]["currentpassword"].value;
        var newpassword = document.forms["passwordForm"]["newpassword"].value;
        var copassword = document.forms["passwordForm"]["copassword"].value;

        var errors = [];

        // Validate current password
        if (currentpassword === "") {
            errors.push("Current password is required.");
        }

        // Validate new password
        if (newpassword === "") {
            errors.push("New password is required.");
        } else if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(newpassword)) {
            errors.push("New password must be at least 8 characters long and contain at least one letter and one number.");
        }

        // Validate confirm password
        if (copassword === "") {
            errors.push("Confirm password is required.");
        } else if (newpassword !== copassword) {
            errors.push("New password and confirm password do not match.");
        }

        if (errors.length > 0) {
            var errorList = document.getElementById("errorList");
            errorList.innerHTML = "";
            for (var i = 0; i < errors.length; i++) {
                var errorItem = document.createElement("li");
                errorItem.innerText = errors[i];
                errorList.appendChild(errorItem);
            }
            return false;
        }

        return true;
    }
</script>

<form name="passwordForm" action="#" method="post" onsubmit="return validateForm()">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-warning text-white">
                <h5 class="modal-title">Change password</h5>
                <button class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <div class="form-group">
                <label for="currentpassword">Current Password</label>
                <input type="password" name="currentpassword" class="form-control" />
            </div>
            <div class="form-group">
                <label for="newpassword">New Password</label>
                <input type="password" name="newpassword" class="form-control" />
            </div>
            <div class="form-group">
                <label for="copassword">Confirm Password</label>
                <input type="password" name="copassword" class="form-control" />
            </div>
            <div class="modal-footer">
                <a href="./profile.php?username=<?php echo $_SESSION['username']; ?>" class="btn">Close</a>
                <input type="submit" class="btn btn-warning" name="updatepass" value="Submit">
            </div>
        </div>
    </div>
</form>

<?php
if (!empty($errors)) {
    echo '<div class="alert alert-danger"><ul>';
    foreach ($errors as $error) {
        echo '<li>' . $error . '</li>';
    }
    echo '</ul></div>';
}
include("./parts/footer.php");
?>