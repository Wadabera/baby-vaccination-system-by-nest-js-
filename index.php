<!DOCTYPE html>
<html lang="en">

<head>
    <!-- Required meta tags -->
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>Admin UI</title>
    <link rel="stylesheet" href="css/style.min.css">
    <style>
/* General Styles */
/* General Styles */
/* General Styles */
body {
    font-family: 'Roboto', sans-serif;
    //background-color: #4F75FF; /* Light green for a fresh look */
    color: #333;
    margin: 0;
    padding: 0;
    transition: background-color 0.3s ease-in-out;
    text-align: center;
}

/* Navigation Bar */
.navbar {
    background: linear-gradient(135deg, #A0E9FF, #9DBDFF);
    position: fixed;
    width: 100%;
    z-index: 1000;
    transition: all 0.3s ease-in-out;
    display: flex;
    justify-content: center;
}
.navbar-brand {
    font-size: 2rem;
    font-weight: bold;
    color: #fff !important;
}
.navbar-nav .nav-item .nav-link {
    font-size: 1.2rem;
    font-weight: bold;
    color: #fff;
    transition: transform 0.3s ease-in-out, color 0.3s ease-in-out;
    margin: 0 15px;
}
.navbar-nav .nav-item .nav-link:hover {
    color: #ffeb3b;
    transform: scale(1.1);
}

/* Header */
#main-header {
    background: linear-gradient(135deg, #08C2FF, #7695FF);
    text-align: center;
    padding: 15px 0;
    font-size: 2.2rem;
    font-weight: bold;
    position: absolute;
    width: 100%;
    top: 56px;
    z-index: 999;
    transition: all 0.3s ease-in-out;
   


}
#main-header h1 {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    margin: 0;
}



/* News Section */
#posts .row {
    padding:40px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    top: 50%;
}
.card {
    display: flex;
    flex-direction: row;
    align-items: center;
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
    //background-color: #e8f5e9; /* Light greenish background */
    padding: 20px;
    margin: 20px 0;
    width: 100%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}
.card img {
    width: 50%;
    height: auto;
    border-radius: 12px;
    transition: transform 0.3s ease-in-out;
}
.card img:hover {
    transform: scale(1.05);
}
.card-body {
    padding: 20px;
    width: 60%;
    text-align: left;
}
.card-title {
    font-size: 1.8rem;
    font-weight: bold;
    color: #388e3c; /* Dark green */
}
.card-text {
    font-size: 1rem;
    color: #444;
}

/* Buttons */
.navbar-nav .nav-item:nth-child(1) .nav-link,
.navbar-nav .nav-item:nth-child(2) .nav-link {
    font-size: 1.3rem;
    padding: 12px 25px;
    background: #006BFF;
    color: #fff !important;
    border-radius: 25px;
    transition: transform 0.3s ease-in-out, background 0.3s ease-in-out;
}
.navbar-nav .nav-item:nth-child(1) .nav-link:hover,
.navbar-nav .nav-item:nth-child(2) .nav-link:hover {
    background: #006Bed;
    transform: scale(1.1);
}

/* Pagination */
.pagination {
    display: flex;
    justify-content: center;
    list-style: none;
    padding: 20px 0;
}
.page-item {
    margin: 0 10px;
}
.page-link {
    font-size: 1.2rem;
    padding: 10px 15px;
    background: #43a047;
    color: #fff;
    border-radius: 5px;
    transition: all 0.3s ease-in-out;
}
.page-link:hover {
    background: #66bb6a;
    transform: scale(1.1);
}
.active .page-link {
    background: #006BFF;
    color: #fff;
}

/* Footer */
#main-footer {
    background: linear-gradient(135deg, #A0E9FF, #7695FF);
    color: #fff;
    text-align: center; 
    width: 100%;
    height: 10px;
    position: absolute; 
    bottom: 0;
    transition: all 0.3s ease-in-out;
}
.lead{
    Text-align: center;
    font-size: 1.2rem;
    Display : flex;
    align-items: center;
    justify-content : center;
}
/

/* Responsive Styles */
@media (max-width: 1024px) {
    .navbar-nav .nav-item .nav-link {
        font-size: 1.1rem;
    }
    .card {
        flex-direction: column;
        width: 90%;
    }
    .card img {
        width: 100%;
    }
    .card-body {
        width: 100%;
        text-align: center;
    }
    .card-title {
        font-size: 1.6rem;
    }
    .card-text {
        font-size: 1rem;
    }
}

@media (max-width: 768px) {
    .navbar-nav {
        flex-direction: column;
        align-items: center;
    }
    .navbar-nav .nav-item .nav-link {
        font-size: 1rem;
    }
    .card {
        flex-direction: column;
        width: 95%;
    }
    .card img {
        width: 100%;
    }
    .card-body {
        width: 100%;
        text-align: center;
    }
    .card-title {
        font-size: 1.4rem;
    }
    .card-text {
        font-size: 0.9rem;
    }
}

@media (max-width: 480px) {
    .navbar-nav .nav-item .nav-link {
        font-size: 0.9rem;
    }
    .card-title {
        font-size: 1.2rem;
    }
    .card-text {
        font-size: 0.8rem;
    }
}


    </style>
</head>

<body>
    <!-- NAVIGATION-->
    <nav class="navbar navbar-expand-sm navbar-dark bg-dark p-0">
        <div class="container">
            <a href="index.php" class="navbar-brand">Infant Vaccination</a>
            <button class="navbar-toggler" data-toggle="collapse" data-target="#navbarNav"></button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ml-auto">
                    <li class="nav-item">
                        <a href="./newhome.php" class="nav-link">
                            <i class="fa fa-user-times"></i> Home
                        </a>
                    </li>
                    <li class="nav-item">
                        <a href="./login.php" class="nav-link">
                            <i class="fa fa-user-times"></i>Login
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- HEADER -->
    <header id="main-header" class="py-2 bg-primary text-white">
        <div class="container">
            <div class="row">
                <div class="col-md-6">
                    <h1 style="align-items:center;"><i class="fa fa-gear"></i> Vaccination News</h1>
                </div>
            </div>
        </div>
    </header>

    <section id="posts">
        <div class="container">
            <div class="row abc">
                <div class="col-md-9">
                    <?php
                    include('./config/constant.php');

                    // Pagination Variables
                    $current_page = isset($_GET['page']) ? $_GET['page'] : 1;
                    $posts_per_page = 3; // Number of posts per page

                    // Calculate offset for database query
                    $offset = ($current_page - 1) * $posts_per_page;

                    $query = "SELECT post.tittle,
                              post.post_id,
                              post.catagory,
                              post.description,
                              post.date_of_post,
                              post_img.img_url
                              FROM post
                              INNER JOIN post_img
                              ON post.post_id = post_img.post_id
                              ORDER BY post.date_of_post ASC
                              LIMIT $offset, $posts_per_page";

                    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
                    $rows = mysqli_num_rows($result);

                    if ($rows > 0) {
                        while ($rows = mysqli_fetch_assoc($result)) {
                            $id = $rows['post_id'];
                            $title = $rows['tittle'];
                            $catagory = $rows['catagory'];
                            $description = $rows['description'];
                            $date_of_post = $rows['date_of_post'];
                            $img_url = $rows['img_url'];
                    ?>
                            <!-- News Card -->

                            <div class="card mb-3">
                                <img src="./images/posts/<?php echo $img_url; ?>" class="card-img-top" alt="<?php echo $img_url; ?>">
                                <div class="card-body">
                                    <b>
                                        <h4 class="card-title"><?php echo $title; ?></h4>
                                    </b>
                                    <p class="card-text crop-text"><?php echo $description; ?></p>
                                    <p><?php echo $date_of_post ?></p>
                                </div>
                            </div>
                            <!-- End News Card -->
                    <?php
                        }
                    }
                    ?>
                </div>
            </div>
        </div>
    </section>

    <!-- Pagination -->
    <!-- <nav aria-label="Page navigation">
        <ul class="pagination justify-content-center">
            <?php
            $query = "SELECT COUNT(*) AS total FROM post";
            $result = mysqli_query($conn, $query);
            $row = mysqli_fetch_assoc($result);
            $total_pages = ceil($row['total'] / $posts_per_page);

            for ($i = 1; $i <= $total_pages; $i++) {
                $active_class = ($i == $current_page) ? 'active' : '';
            ?>
                <li class="page-item <?php echo $active_class; ?>">
                    <a class="page-link" href="index.php?page=<?php echo $i; ?>"><?php echo $i; ?></a>
                </li>
            <?php
            }
            ?>
        </ul>
    </nav> -->
    <!-- End Pagination -->

    <footer id="main-footer" class="bg-dark text-white mt-5 p-5">
        <div class="container">
            <div class="row">
                <div class="col">
                    <p class="lead text-center">© 2025 All rights reserved</p>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
</body>

</html>