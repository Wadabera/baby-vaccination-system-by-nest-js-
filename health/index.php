<?php include("./parts/header.php"); ?>

<header id="main-header" class="py-2 bg-primary text-white">
    <div class="container">
        <div class="row">
            <div class="col-12 text-center">
                <h1>Doctor Dashboard</h1>
            </div>
        </div>
    </div>
</header>

<div class="container mt-5" id="content-container">
    <div class="row justify-content-center">
        <!-- Total Mothers Card -->
        <div class="col-md-3">
            <div class="card text-center hover-effect">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from mother_table";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="neon-text"><?php echo $rows ?></h2>
                    <p>Total Mothers</p>
                </div>
            </div>
        </div>

        <!-- Total Children Card -->
        <div class="col-md-3 mt-4">
            <div class="card text-center hover-effect">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from child_table";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="neon-text"><?php echo $rows ?></h2>
                    <p>Total Children</p>
                </div>
            </div>
        </div>

        <!-- Total Mother Vaccinations Card (Optional) -->
        <!-- <div class="col-md-3 mt-4">
            <div class="card text-center hover-effect">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from mother_vaccin";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="neon-text"><?php echo $rows ?></h2>
                    <p>Total Mother Vaccinations</p>
                </div>
            </div>
        </div> -->

        <!-- Total Child Vaccinations Card (Optional) -->
        <!-- <div class="col-md-3 mt-4">
            <div class="card text-center hover-effect">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from child_vaccine";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="neon-text"><?php echo $rows ?></h2>
                    <p>Total Child Vaccinations</p>
                </div>
            </div>
        </div> -->
    </div>
</div>

//<?php include('./parts/footer.php'); ?>

<!-- Add custom CSS styles below -->
<style>
    /* Image Background */
    #content-container {
        background-image: url('empty-modern-arms-crossed-corporate-physician.jpg'); /* Replace with your image path */
        background-size: cover; /* Ensures the background image covers the full width */
        background-position: center center; /* Centers the image */
        background-attachment: fixed; /* Optional: makes the image fixed when scrolling */
        width: 100%;
        height: 50vh; /* Ensures the container takes up the full viewport height */
        padding: 50px 0; /* Adjust padding to make sure the content fits nicely */
        box-sizing: border-box; /* Ensures padding does not affect the width */
    }


    /* Gradient Effect with Blue Theme */
    body {
        background: linear-gradient(45deg, #1e3c72, #2a5298); /* Gradient of blue shades */
        min-height: 100vh;
    }

    /* Hover Effects */
    .hover-effect {
        transition: transform 0.4s ease, box-shadow 0.4s ease;
    }

    .hover-effect:hover {
        transform: translateY(-10px);
        box-shadow: 0px 8px 25px rgba(0, 0, 0, 0.2);
    }

    /* Neon Glow Effect in Blue */
    .neon-text {
        color: #ffffff;
        text-shadow: 0 0 5px #00b5e2, 0 0 10px #00b5e2, 0 0 15px #00b5e2, 0 0 20px #00b5e2;
    }

    /* Premium Design with Smooth Borders and Shadows */
    .card {
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        transition: box-shadow 0.4s ease, border 0.4s ease;
    }

    .card:hover {
        box-shadow: 0px 10px 15px rgba(0, 0, 0, 0.2);
        border: 2px solid #2a5298; /* Border color is now blue */
    }

    /* Align Cards in the Center */
    .row {
        display: flex;
        justify-content: center;
        align-items: center;
    }

    /* Adjust card sizes and margins */
    .col-md-3 {
        margin: 10px;
        
    }

    .card-body {
        padding: 20px;
    }
    #main-footer{
    position: fixed;
    bottom: 0;
    width: 100%;
    height: 50px;
    align-items: center;
</style>
