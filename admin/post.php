<?php include("./parts/header.php") ?>

<!--HEADER -->
<header id="main-header" class="py-2 bg-primary text-white">
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <h1><i class="fa fa-pencil"> Posts</i></h1>
      </div>
    </div>
  </div>
</header>

<?php
if (isset($_SESSION['add'])) {
  echo "<script>alert('" . $_SESSION['add'] . "')</script>";
  unset($_SESSION['add']);
}

?>
<!--ACTIONS BUTTONS-->

<section id="action" class="py-4 mb-4 bg-light">
  <!-- <div class="container">
    <div class="row">
      <div class="col-md-6 ml-auto">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="search">
          <span class="input-group-btn">
            <button class="btn btn-primary">Search</button>
          </span>
        </div>
      </div>
    </div>
  </div> -->
</section>

<section id="posts">
  <div class="container">
    <div class="container">
      <div class="row">
        <div class="col-md-3">
          <a href="add_new_post.php" class="btn btn-warning btn-block">
            <i class="fa fa-plus">
              Add new Post
            </i>
          </a>
        </div>
      </div>
    </div>
    <br><br>
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-header">
            <h4>Latest Posts</h4>
          </div>

          <table class="table table-striped">
            <thead class="thead-inverse">
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Categories</th>
                <th>Date Posted</th>
                <th>Actions</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              <?php
              $query = "SELECT * FROM post order by post.date_of_post DESC";

              $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
              $rows = mysqli_num_rows($result);

              if ($rows > 0) {
                while ($rows = mysqli_fetch_assoc($result)) {
                  $id = $rows['post_id'];
                  $title = $rows['tittle'];
                  $catagory = $rows['catagory'];
                  $description = $rows['description'];
                  $date_of_post = $rows['date_of_post'];

              ?>
                  <tr>
                    <td><?php echo $id ?></td>
                    <td scopr="row"><?php echo $title ?></td>
                    <td><?php echo $catagory ?></td>

                    <td><?php echo $date_of_post ?></td>

                    <td>
                      <a href="details.php?id=<?php echo $id ?>" class="btn btn-secondary"><i class="fa fa-angle-double-right"> update post</i></a>
                    </td>

                    <td>
                      <a href="delete_post.php?id=<?php echo $id; ?>" class="btn btn-danger btn-block"><i class="fa fa-remove"> Delete Post</i></a>
                    </td>

                  </tr>
              <?php }
              } ?>
            </tbody>


          </table>


        </div>
      </div>
    </div>
  </div>
</section>

</select>
</div>



<?php include("./parts/footer.php") ?>