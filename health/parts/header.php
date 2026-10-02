<?php include("../config/constant.php"); ?>
<?php include("logincheck.php");  
$usr = $_SESSION['username'];
?>

<!DOCTYPE html>
<html lang="en">

<head>
  <!-- Required meta tags -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
  <script src="script.min.js" defer></script>
  <link rel="stylesheet" href="../css/style.min.css" />
  <link rel="stylesheet" href="resources/css/style.css" />
  <link rel="stylesheet" href="vendors/font-awesome/css/all.css" />
  <title>Admin UI</title>

  <style>
    /* Global Reset */
    html,
    body {
      margin: 0;
      padding: 0;
      height: 100%;
      font-family: 'Poppins', sans-serif;
    }

    /* Navbar Styling */
    nav {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 1000;
      background: linear-gradient(135deg, #1e3c72, #2a5298); /* Gradient background */
      padding: 10px 20px;
      transition: background 0.3s ease-in-out; /* Transition for background */
    }

    nav a.nav-link {
      font-size: 18px; /* Enlarged font size */
      font-weight: bold;
      color: white;
      transition: all 0.3s ease-in-out; /* Smooth transition for hover */
    }

    nav a.nav-link:hover {
      color: #ff0a6f; /* Neon glow effect on hover */
      text-shadow: 0 0 10px rgba(255, 10, 111, 0.8), 0 0 20px rgba(255, 10, 111, 0.6);
      transform: scale(1.1); /* Slightly enlarge the text on hover */
    }

    nav .navbar-toggler {
      border: 1px solid #fff;
    }

    nav .navbar-toggler-icon {
      background-color: #fff;
    }

    /* Dropdown Hover Styling */
    nav .nav-item.dropdown:hover {
      background-color: rgba(0, 0, 0, 0.2); /* Darken the background on hover */
    }

    nav .nav-item.dropdown:hover .nav-link {
      color: #ff0a6f; /* Neon glow effect on dropdown hover */
      text-shadow: 0 0 10px rgba(255, 10, 111, 0.8), 0 0 20px rgba(255, 10, 111, 0.6);
      transform: scale(1.1); /* Slightly enlarge the text on hover */
    }

    /* Active Nav Item Styling */
    nav .nav-item.active {
      background-color: rgba(0, 0, 0, 0.2); /* Darken the background for active link */
      border-radius: 5px;
    }

    nav .navbar-nav {
      flex-direction: row;
      align-items: center;
    }

    /* Responsive Styling for Smaller Screens */
    @media (max-width: 768px) {
      nav {
        padding: 10px;
      }

      nav .navbar-nav {
        text-align: center;
      }

      nav .navbar-nav .nav-item {
        margin-bottom: 10px;
      }
    }
  </style>
</head>

<body>
  <!-- NAVIGATION -->
  <nav class="navbar navbar-expand-sm navbar-dark p-0">
    <div class="container">
      <a href="index.php" class="navbar-brand">Infant Immunization</a>
      <button class="navbar-toggler" data-toggle="collapse" data-target="#navbarNav"></button>
      <div class="collapse navbar-collapse" id="navbarNav">
        <ul class="navbar-nav">
          <li class="nav-item px-2">
            <a href="index.php" class="nav-link active">Dashboard</a>
          </li>
          <li class="nav-item px-2">
            <a href="children.php" class="nav-link">Children</a>
          </li>
          <li class="nav-item px-2">
            <a href="mother.php" class="nav-link">Mothers</a>
          </li>
        </ul>
        <ul class="navbar-nav ml-auto">
          <li class="nav-item dropdown mr-3">
            <a href="profile.php?username=<?php echo $usr ?>" class="nav-link dropdown-toggle">
              <i class="fa fa-user"></i> <?php echo $usr; ?> Profile</a>
          </li>
          <li class="nav-item">
            <a href="../logout.php" class="nav-link">
              <i class="fa fa-user-times"></i> Logout
            </a>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</body>

</html>
