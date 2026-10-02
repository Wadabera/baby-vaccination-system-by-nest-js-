<?php 
// Include your database connection
include("../admin/parts/header.php"); 
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registrar Dashboard</title>
    <style>
        /* General Page Styling */
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
            color: white;
            text-align: center;
        }

        /* Header Styling */
        #main-header {
            background-color: rgba(0, 102, 204, 0.9);
            color: white;
            padding: 20px 0;
            font-size: 2rem;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 1.5px;
        }

        /* Background Image Wrapper */
        .background-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 50vh;
            position: relative;
        }

     
.background-container img {
    width: 50%;  
    max-height: 90vh;  
    border-radius: 15px;
    box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.3);
    position:absolute;
    top:5%;

}

        /* Container Styling */
        .container {
            padding-top: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        }

        .row {
            display: flex;
            justify-content: space-evenly;
            width: 100%;
            flex-wrap: wrap;
        }

        /* Card Styling */
        .card {
            background: #7E60BF;
            border: none;
            border-radius: 15px;
            box-shadow: 0px 6px 20px rgba(0, 0, 0, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            width: 250px;
            margin: 15px;
            padding: 20px;
            color: #003366;
        }

        .card:hover {
            transform: translateY(-10px);
            box-shadow: 0px 12px 30px rgba(0, 0, 0, 0.3);
        }

        /* Neon Glow Effect */
        h2 {
            font-size: 2rem;
            color: #00ffcc;
            text-shadow: 0 0 15px #00ffcc, 0 0 30px #00ffcc, 0 0 45px #00ffcc;
        }

        /* Responsive Design */
        @media (max-width: 768px) {
            .card {
                width: 90%;
            }

            .row {
                flex-direction: column;
                align-items: center;
            }

            #main-header {
                font-size: 1.8rem;
            }

            .background-container img {
                max-width: 80%;
            }
        }

        /* Smooth Fade-in Effect */
        .fade-in {
            animation: fadeIn 1s ease-in-out;
        }

        @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
        

        
    </style>
</head>
<body>

    <!-- Header Section -->
    <header id="main-header" class="fade-in">
        <h1>Registrar Dashboard</h1>
    </header>

    <!-- Background Image Section -->
    <div class="background-container fade-in">
        <img src="registeral2.jpg" alt="Registrar Background">
    </div>

    <!-- Cards Section -->
    <div class="container mt-5 fade-in">
        <div class="row">
            <div class="col-md-3">
                <div class="card text-center">
                    <div class="card-body">
                        <?php
                        $query = "SELECT * from mother_table";
                        $result = mysqli_query($conn, $query);
                        $rows = mysqli_num_rows($result);
                        ?>
                        <h2><?php echo $rows ?></h2>
                        <p>Total Mothers</p>
                    </div>
                </div>
            </div>

            <div class="col-md-3 mt-4">
                <div class="card text-center">
                    <div class="card-body">
                        <?php
                        $query = "SELECT * from child_table";
                        $result = mysqli_query($conn, $query);
                        $rows = mysqli_num_rows($result);
                        ?>
                        <h2><?php echo $rows ?></h2>
                        <p>Total Children</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Footer Section -->
    <footer id="main-footer" class="bg-dark text-white mt-5 p-4">
        <p class="lead text-center">Copyright &copy; 2026</p>
    </footer>

</body>
</html>
