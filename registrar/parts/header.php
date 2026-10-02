<?php
// Start output buffering to prevent headers already sent errors
ob_start();

// Including necessary files
include("../config/constant.php");
include("logincheck.php");
$usr = $_SESSION['username'];
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <script src="script.min.js" defer></script>
    <link rel="stylesheet" href="../css/style.min.css">
    <link rel="stylesheet" href="resources/css/style.css">
    <link rel="stylesheet" href="vendors/font-awesome/css/all.css">
    <title>Admin UI</title>

    <!-- Your custom styles -->
    <style>
        body {
            background: linear-gradient(to right, #0f0c29, #302b63, #24243e); 
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: white;
        }

    <style>
        /* General Styles */
        body {
            background: linear-gradient(to right, #0f0c29, #302b63, #24243e); /* Modern gradient effect */
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            color: white;
        }

        /* Fixed Navbar Styling */
        .navbar {
            background: rgba(0, 0, 0, 0.9); /* Darker background for better visibility */
            padding: 15px 0;
            transition: background 0.3s ease-in-out;
            top: 0;
            width: 100%;
            z-index: 1000;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }

        .navbar-brand {
            font-size: 2rem; /* Increased font size */
            font-weight: bold;
            letter-spacing: 1px;
            color: #00eaff; /* Neon blue */
            text-shadow: 0 0 15px #00eaff, 0 0 30px #00eaff;
        }

        .navbar-nav {
            display: flex;
            gap: 25px;
        }

        .navbar-nav .nav-link {
            font-size: 1.3rem; /* Increased font size */
            font-weight: bold;
            color: #ffffff;
            transition: color 0.3s ease, transform 0.3s ease;
            padding: 12px 20px;
            border-radius: 8px;
        }

        .navbar-nav .nav-link:hover {
            color: #ff00ff; /* Neon pink hover */
            transform: scale(1.1);
            text-shadow: 0 0 10px #ff00ff, 0 0 20px #ff00ff;
            background: rgba(255, 255, 255, 0.2);
        }

        .nav-link {
            display: flex;
            gap: 20px; /* Adds spacing between links */
            align-items: center; /* Aligns items in the center */
            justify-content: center; /* Centers the nav links */
            gap: 1.2em;
        }

        /* Dropdown Menu */
        .dropdown-menu {
            background: #1a1a2e;
            border-radius: 8px;
            padding: 10px;
            box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.3);
            animation: fadeIn 0.3s ease-in-out;
        }

        .dropdown-item {
            color: white;
            font-size: 1.2rem;
            transition: background 0.3s ease, transform 0.2s ease;
        }

        .dropdown-item:hover {
            background: #00eaff;
            transform: translateX(5px);
            color: black;
        }

        /* Button Styling */
        .nav-item .nav-link i {
            padding-right: 8px;
        }

        .nav-item .nav-link {
            border-radius: 8px;
            transition: background 0.3s ease-in-out, transform 0.3s ease;
        }

        .nav-item .nav-link:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: scale(1.05);
        }

        /* Responsive Design */
        @media (max-width: 992px) {
            .navbar-nav {
                flex-direction: column;
                align-items: center;
                gap: 10px;
            }

            .navbar-nav .nav-link {
                font-size: 1.2rem;
            }
        }

        @media (max-width: 768px) {
            .navbar-brand {
                font-size: 1.8rem;
            }

            .navbar-nav {
                flex-direction: column;
                align-items: center;
                text-align: center;
            }

            .navbar-nav .nav-link {
                font-size: 1rem;
                padding: 10px;
            }
        }

        /* Animations */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    </style>
    </style>
</head>

<body>
<!-- Navigation and rest of your page content -->

</body>
</html>

<?php
// End output buffering and send the output to the browser
ob_end_flush();
?>
add-user.php
Make sure ob_start() is placed at the very top of add-user.php:

php
Copy
<?php
// Start output buffering
ob_start();

// Include the necessary files
include("./parts/header.php");
include("../config/constant.php"); // Assuming the database connection is in this file

// Check if form is submitted
if (isset($_POST['submit'])) {
    $f_name = $_POST['f_name'];
    $m_name = $_POST['m_name'];
    $l_name = $_POST['l_name'];
    $birthdate = $_POST['birthdate'];
    $blood_type = $_POST['blood_type'];
    $phone_number = $_POST['phone_number'];
    $password = md5($_POST['password']);  // You might want to use a stronger hash method
    $zone = $_POST['zone'];
    $wereda = $_POST['wereda'];
    $kebele = $_POST['kebele'];

    // Handle the file upload for image
    if (isset($_FILES['image']['name'])) {
        $image_name = $_FILES['image']['name'];
        $image_source = $_FILES['image']['tmp_name'];

        $extension = pathinfo($image_name, PATHINFO_EXTENSION);
        $new_image_name = $f_name . $m_name . $l_name . '.' . $extension;

        $image_destination = "../images/mother/" . $new_image_name;

        if (move_uploaded_file($image_source, $image_destination)) {
            $upload = TRUE;
        } else {
            $_SESSION["add"] = "Failed to upload image";
            header("Location:" . HOMEURL . "/registrar/mother.php");
            die();
        }
    }

    // Insert into mother_table
    $query = "INSERT INTO `webproject`.`mother_table` 
              (f_name, m_name, l_name, bithdate, photo_url, blood_type, m_phone, zone, wereda, kebele)
              VALUES ('$f_name', '$m_name', '$l_name', '$birthdate', '$new_image_name', '$blood_type', '$phone_number', '$zone', '$wereda', '$kebele')";
    
    $result = mysqli_query($conn, $query);

    if ($result) {
        // Insert into mother_vaccin table
        $query2 = "INSERT INTO mother_vaccin (m_id, tt1, tt2, tt3, tt4, tt5, rh)
                    VALUES (LAST_INSERT_ID(), 0, 0, 0, 0, 0, 0)";
        
        $result2 = mysqli_query($conn, $query2);

        if ($result2) {
            $_SESSION["add"] = $f_name . " successfully added";
            header("Location:" . HOMEURL . "/registrar/mother.php");
        } else {
            $_SESSION["add"] = $f_name . " failed to add vaccination information";
            header("Location:" . HOMEURL . "/registrar/add-user.php");
        }
    } else {
        $_SESSION["add"] = $f_name . " failed to add";
        header("Location:" . HOMEURL . "/registrar/add-user.php");
    }
} else {
    echo "Button not clicked";
}

// End output buffering
ob_end_flush();
?>