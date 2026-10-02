<?php include("./parts/header.php"); ?>
<!DOCTYPE html>
<html>

<head>
    <title>Profile</title>
    <style>
        .profile-container {
            background-color: #497D74;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            padding: 40px;
            max-width: 500px;
            width: 100%;
            text-align: left;
            color: white;
            margin: 0 auto;
        }

        .profile-image {
            width: 150px;
            height: 150px;
            object-fit: cover;
            border-radius: 50%;
        }

        .profile-table {
            margin-top: 20px;
        }

        .profile-table td {
            padding: 10px;
        }

        .btn-secondary {
            display: inline-block;
            padding: 8px 16px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            color: #000;
            background-color: #e4e6eb;
            border-radius: 4px;
            transition: background-color 0.3s ease;
            margin-right: 10px;
        }

        .btn-secondary:hover {
            background-color: #dfe3e8;
        }

        .success {
            color: #4caf50;
        }
        body{
        background-color:#7ED4AD;

        }
    </style>
</head>

<body>
    <div class="profile-container">
        <h1>Profile</h1>

        <?php
        // Display session message if exists
        if (isset($_SESSION['add'])) {
            echo "<h2 class='success'>" . $_SESSION['add'] . "</h2>";
            unset($_SESSION['add']);
        }

        // Get the username from the URL
        $username = $_GET['username'];

        // Fetch the user data from the database
        $query = "SELECT * FROM webproject.users WHERE username='$username'";
        $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

        if ($result == TRUE) {
            $rows = mysqli_num_rows($result);
            if ($rows > 0) {
                while ($row = mysqli_fetch_assoc($result)) {
                    $id = $row['user_id'];
                    $username = $row['username'];
                    $role = $row['role'];
                    $f_name = $row['f_name'];
                    $m_name = $row['m_name'];
                    $l_name = $row['l_name'];
                    $phone_number = $row['phone_number'];
                    $email = $row['email'];
                    $image_url = $row['image_url']; // Image URL field from the database

                    // Define the image path
                    $image_path = "./images/users/" . htmlspecialchars($image_url);

                    // Debugging: Check if image exists
                    echo "<p>Image Path: " . $image_path . "</p>"; // Output the image path to check if it's correct

                    // Check if the image exists in the server directory
                    if (file_exists($_SERVER['DOCUMENT_ROOT'] . "/" . $image_path)) {
                        echo "<img class='profile-image' src='$image_path' alt='Profile Image'>";
                    } else {
                        echo "<p>Image not found or incorrect path!</p>"; // Debugging output for image missing
                        echo "<img class='profile-image' src='./images/default-profile.jpg' alt='Default Profile Image'>";
                    }
        ?>

                    <div class="profile-table">
                        <table>
                            <tr>
                                <td><strong>Username:</strong> <?php echo htmlspecialchars($username); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Role:</strong> <?php echo htmlspecialchars($role); ?></td>
                            </tr>
                            <tr>
                                <td><strong>First Name:</strong> <?php echo htmlspecialchars($f_name); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Middle Name:</strong> <?php echo htmlspecialchars($m_name); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Last Name:</strong> <?php echo htmlspecialchars($l_name); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Phone Number:</strong> <?php echo htmlspecialchars($phone_number); ?></td>
                            </tr>
                            <tr>
                                <td><strong>Email:</strong> <?php echo htmlspecialchars($email); ?></td>
                            </tr>
                            <tr>
                                <td>
                                    <a href="change_password.php?id=<?php echo $id; ?>" class="btn-secondary">Change Password</a>
                                </td>
                            </tr>
                        </table>
                    </div>

        <?php
                }
            } else {
                echo "<p>No user found.</p>";
            }
        }
        ?>
    </div>
</body>

</html>

<?php include("./parts/footer.php"); ?>
