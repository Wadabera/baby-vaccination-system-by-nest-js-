<?php include("./parts/header.php"); ?>

<header id="main-header" class="py-2 bg-primary text-white">
    <div class="container">
        <div class="row">
            <div class="col-12 text-center">
                <h1>Admin Dashboard</h1>
            </div>
        </div>
    </div>
</header>

<div class="container mt-5">
    <div class="row">
        <div class="col-md-3">
            <div class="card text-center card-hover">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from users";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="card-title"><?php echo $rows ?></h2>
                    <p>Users</p>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card text-center card-hover">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from post";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="card-title"><?php echo $rows ?></h2>
                    <p>Total Posts</p>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card text-center card-hover">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from mother_table";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="card-title"><?php echo $rows ?></h2>
                    <p>Total Mothers</p>
                </div>
            </div>
        </div>

        <div class="col-md-3">
            <div class="card text-center card-hover">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from child_table";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="card-title"><?php echo $rows ?></h2>
                    <p>Total Children</p>
                </div>
            </div>
        </div>

        <div class="col-md-3 mt-4">
            <div class="card text-center card-hover">
                <div class="card-body">
                    <?php
                    $query = "SELECT * from post_img";
                    $result = mysqli_query($conn, $query);
                    $rows = mysqli_num_rows($result);
                    ?>
                    <h2 class="card-title"><?php echo $rows ?></h2>
                    <p>Total Post Images</p>
                </div>
            </div>
        </div>
    </div>
</div>

<?php include("./parts/footer.php"); ?>

<!-- Custom Styles -->
<style>
    /* Card Style - Gradient, Shadows, and Hover Effects */
    .card-hover {
        background: linear-gradient(135deg, rgba(255, 60, 108, 1), rgba(29, 78, 216, 1));
        border-radius: 8px;
        transition: transform 0.3s ease, box-shadow 0.3s ease;
        box-shadow: 0px 8px 20px rgba(0, 0, 0, 0.1);
    }

    .card-hover:hover {
        transform: translateY(-10px); /* Slight lift effect */
        box-shadow: 0px 12px 30px rgba(0, 0, 0, 0.2);
    }

    /* Card Title (Bold and Enhanced Hover Effect) */
    .card-title {
        font-weight: bold;
        font-size: 2rem;
        transition: color 0.3s ease, text-shadow 0.3s ease;
    }

    .card-hover:hover .card-title {
        color: #ff3c6c; /* Neon-like text color */
        text-shadow: 0px 0px 10px rgba(255, 60, 108, 0.8), 0px 0px 15px rgba(29, 78, 216, 0.8);
    }

    /* Card Paragraph Style */
    .card p {
        font-size: 1.2rem;
        font-weight: 600;
        color: #fff;
        transition: color 0.3s ease;
    }

    .card-hover:hover p {
        color: #ff3c6c; /* Change text color on hover */
    }

    /* Card Body (Padding, Border Radius, and Hover Effect) */
    .card-body {
        padding: 2rem;
        border-radius: 8px;
        background: rgba(0, 0, 0, 0.1);
        transition: background-color 0.3s ease;
    }

    .card-hover:hover .card-body {
        background: rgba(0, 0, 0, 0.15); /* Darker background on hover */
    }

    /* Smoother Borders and Shadows */
    .card {
        border-radius: 12px;
        box-shadow: 0px 6px 15px rgba(0, 0, 0, 0.1);
    }

    .card-hover:hover {
        box-shadow: 0px 12px 25px rgba(0, 0, 0, 0.2);
    }

    /* Responsive Adjustments */
    @media (max-width: 768px) {
        .card-hover {
            margin-bottom: 20px;
        }

        .card-title {
            font-size: 1.5rem;
        }

        .card p {
            font-size: 1rem;
        }
    }
</style>
