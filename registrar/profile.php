<?php include("./parts/header.php"); ?>
<!DOCTYPE html>
<html lang="en">

<head>
    <title>Profile</title>
    <style>
        * {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: linear-gradient(135deg, #1e3c72, #2a5298);
            justify-content: center;
            align-items: center;
            height: 100vh;
            color: white;
        }

        .profile-container {
            background: rgba(0, 0, 0, 0.8);
            border-radius: 10px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
            position: absolute;
            left: 35%;
            top: 13%;
        }

        .profile-image {
            width: 150px;
            height: 150px;
            object-fit: cover;
            border-radius: 50%;
            border: 3px solid #00aaff;
            transition: transform 0.3s;
        }

        .profile-image:hover {
            transform: scale(1.1);
        }

        .profile-table {
            margin-top: 20px;
            width: 100%;
            text-align: left;
        }

        .profile-table td {
            padding: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary {
            display: inline-block;
            padding: 10px 16px;
            font-size: 14px;
            font-weight: bold;
            text-decoration: none;
            color: #fff;
            background: #007bff;
            border-radius: 5px;
            transition: background 0.3s;
            margin-bottom: 0; /* Added margin-bottom: 0 */
        }

        .btn-secondary:hover {
            background: #0056b3;
        }

        .success {
            color: #4caf50;
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
        if (isset($_GET['username'])) {
            $username = $_GET['username'];

            // Fetch the user data from the database
            $query = "SELECT * FROM webproject.users WHERE username='$username'";
            $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

            if ($result == TRUE) {
                $rows = mysqli_num_rows($result);
                if ($rows > 0) {
                    $row = mysqli_fetch_assoc($result);
                    $id = $row['user_id'];
                    $username = $row['username'];
                    $role = $row['role'];
                    $f_name = $row['f_name'];
                    $m_name = $row['m_name'];
                    $l_name = $row['l_name'];
                    $phone_number = $row['phone_number'];
                    $email = $row['email'];
                    $image_url = $row['image_url']; // Image URL field from the database
        ?>

                    <div class="profile-table">
                        <table>
                            <tr>
                                <td>
                                    <img class="profile-image" src="./../images/users/<?php echo $image_url ?>" alt="Profile Image">
                                </td>
                            </tr>
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
                                <td style="text-align: center;">
                                    <a href="change_password.php?id=<?php echo $id; ?>" class="btn-secondary">Change Password</a>
                                </td>
                            </tr>
                        </table>
                    </div>

        <?php
                } else {
                    echo "<p>No user found.</p>";
                }
            }
        } else {
            echo "<p>No username provided.</p>";
        }
        ?>
    </div>
</body>

</html>

<?php include("./parts/footer.php"); ?>
