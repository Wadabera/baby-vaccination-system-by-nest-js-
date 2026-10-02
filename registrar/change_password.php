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

<style>
    /* Style for labels */
    label {
        font-size: 16px; /* Adjust the size */
        font-weight: bold; /* Bold the labels */
        color: #333; /* Set text color */
        display: block; /* Display as block element */
        margin-bottom: 8px; /* Add space below label */
    }

    /* Style for form fields */
    .form-group {
        margin-bottom: 15px;
    }

    .form-control {
        width: 100%;
        padding: 10px;
        font-size: 16px;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    /* Error message style */
    .alert-danger {
        color: red;
        background-color: #f8d7da;
        border-color: #f5c6cb;
        padding: 10px;
    }
    
    /* Body and Form Container */
    body {
        font-family: 'Arial', sans-serif;
        background-color: #f0f4f8;
        padding: 20px;
    }

    .modal-content {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        padding: 30px;
        animation: fadeIn 1s ease-in-out;
    }

    /* Title Animation */
    .modal-title {
        font-size: 24px;
        font-weight: bold;
        color: #333;
        text-align: center;
        animation: textGlow 3s ease-in-out infinite;
    }

    /* Form Group with Label */
    .form-group {
        margin-bottom: 20px;
        position: relative;
    }

    /* Label with Animation */
    label {
        font-size: 16px;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 8px;
        position: relative;
        animation: labelBounce 1s ease-in-out;
    }

    /* Input Fields */
    .form-control {
        width: 100%;
        padding: 12px;
        font-size: 16px;
        border: 2px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
        transition: all 0.3s ease;
    }

    .form-control:focus {
        border-color: #FF6F61;
        outline: none;
        box-shadow: 0 0 5px rgba(255, 111, 97, 0.6);
    }

    /* Button Styling */
    .btn-warning {
        background: linear-gradient(45deg, #ff6f61, #ff9e44, #ffeb3b);
        padding: 12px 25px;
        border: none;
        color: white;
        font-size: 16px;
        font-weight: bold;
        border-radius: 4px;
        cursor: pointer;
        transition: transform 0.3s ease;
    }

    .btn-warning:hover {
        transform: scale(1.1);
        background: linear-gradient(45deg, #ff9e44, #ff6f61, #ffeb3b);
    }

    /* Error Message Box */
    .alert-danger {
        color: red;
        background-color: #f8d7da;
        border-color: #f5c6cb;
        padding: 15px;
        border-radius: 4px;
        margin-bottom: 20px;
    }

    /* Keyframe Animations */
    @keyframes fadeIn {
        0% {
            opacity: 0;
        }
        100% {
            opacity: 1;
        }
    }

    @keyframes labelBounce {
        0% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-5px);
        }
        100% {
            transform: translateY(0);
        }
    }

    @keyframes textGlow {
        0% {
            color: #ff6f61;
            text-shadow: 0 0 10px #ff6f61, 0 0 20px #ff6f61, 0 0 30px #ff6f61;
        }
        50% {
            color: #ff9e44;
            text-shadow: 0 0 10px #ff9e44, 0 0 20px #ff9e44, 0 0 30px #ff9e44;
        }
        100% {
            color: #ff6f61;
            text-shadow: 0 0 10px #ff6f61, 0 0 20px #ff6f61, 0 0 30px #ff6f61;
        }
    }


</style>

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
