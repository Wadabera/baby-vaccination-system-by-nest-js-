<?php include("./parts/header.php"); ?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Profile</title>

    <style>
        /* General Body Styling */
        body {
            font-family: Arial, sans-serif;
            background: #A6F1E0;
            margin: 0;
            padding: 0;
            color: #333;
        }

        /* Profile Container */
        .profile-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            background: #E8F9FF;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
        }

        /* Header Styling */
        h1 {
            text-align: center;
            font-size: 2rem;
            color: #333;
        }

        /* Success Message Styling */
        .success {
            color: #28a745;
            font-weight: bold;
            text-align: center;
            font-size: 1.2rem;
        }

        /* Profile Table Styling */
        .profile-table {
            width: 100%;
            margin-top: 20px;
        }

        .profile-table table {
            width: 100%;
            border-collapse: collapse;
        }

        .profile-table td {
            padding: 12px;
            border-bottom: 1px solid #ddd;
            vertical-align: middle;
        }

        .profile-table tr:last-child td {
            border-bottom: none;
        }

        .profile-table td strong {
            font-weight: bold;
            color: #444;
        }

        /* Profile Image */
        .profile-image {
            width: 150px;
            height: 150px;
            object-fit: cover;
            border-radius: 50%;
            display: block;
            margin: 0 auto 15px;
        }

        /* Button Styling */
        .btn {
            display: inline-block;
            padding: 10px 20px;
            font-size: 1rem;
            color: #fff;
            background: #007bff;
            text-decoration: none;
            border-radius: 5px;
            text-align: center;
            transition: background-color 0.3s ease;
        }

        .btn:hover {
            background: #0056b3;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .profile-container {
                padding: 15px;
            }

            h1 {
                font-size: 1.8rem;
            }

            .profile-table td {
                padding: 8px;
            }

            .profile-table td strong {
                font-size: 1rem;
            }
        }
    </style>
</head>

<body>

    <div class="profile-container">
        <h1>Profile</h1>

        <?php
        // Display success message if set
        if (isset($_SESSION['add'])) {
            echo "<h2 class='success'>" . $_SESSION['add'] . "</h2>";
            unset($_SESSION['add']);
        }

        // Get the username from the query parameter
        $username = $_GET['username'];
        ?>

        <div class="profile-table">
            <table>
                <?php
                // Query to fetch user data based on the username
                $query = "SELECT * FROM webproject.users WHERE username='$username' LIMIT 1";
                $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

                if ($result == TRUE) {
                    $rows = mysqli_num_rows($result);
                    if ($rows == 1) {
                        // Fetch user details
                        $row = mysqli_fetch_assoc($result);
                        $id = $row['user_id'];
                        $username = $row['username'];
                        $role = $row['role'];
                        $f_name = $row['f_name'];
                        $m_name = $row['m_name'];
                        $l_name = $row['l_name'];
                        $phone_number = $row['phone_number'];
                        $email = $row['email'];
                        $image_url = $row['image_url'];
                ?>
                        <tr>
                            <td colspan="2" style="text-align:center;">
                                <img class="profile-image" src="./../images/users/<?php echo $image_url ?>" alt="Profile Image">
                            </td>
                        </tr>
                        <tr>
                            <td><strong>Username:</strong></td>
                            <td><?php echo $username ?></td>
                        </tr>
                        <tr>
                            <td><strong>Role:</strong></td>
                            <td><?php echo $role ?></td>
                        </tr>
                        <tr>
                            <td><strong>First Name:</strong></td>
                            <td><?php echo $f_name ?></td>
                        </tr>
                        <tr>
                            <td><strong>Middle Name:</strong></td>
                            <td><?php echo $m_name ?></td>
                        </tr>
                        <tr>
                            <td><strong>Last Name:</strong></td>
                            <td><?php echo $l_name ?></td>
                        </tr>
                        <tr>
                            <td><strong>Phone Number:</strong></td>
                            <td><?php echo $phone_number ?></td>
                        </tr>
                        <tr>
                            <td><strong>Email:</strong></td>
                            <td><?php echo $email ?></td>
                        </tr>
                        <tr>
                            <td colspan="2" style="text-align:center;">
                                <a href="change_password.php?id=<?php echo $id; ?>" class="btn">Change Password</a>
                            </td>
                        </tr>
                <?php
                    } else {
                        echo "<tr><td colspan='2'>No profile found for this user.</td></tr>";
                    }
                }
                ?>
            </table>
        </div>
    </div>

    <?php include('./parts/footer.php'); ?>
</body>

</html>
