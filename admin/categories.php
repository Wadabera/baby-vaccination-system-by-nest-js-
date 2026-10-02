<?php include("./parts/header.php") ?>

<!--HEADER -->
<!-- <header id="main-header" class="py-2 bg-success text-white">
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <h1><i class="fa fa-folder"> Vaccines</i></h1>
      </div>
    </div>
  </div>
</header>

<!--ACTIONS BUTTONS-->
<section id="action" class="py-4 mb-4 bg-light">
  <div class="container">
    <!-- <div class="row">
      <div class="col-md-6 ml-auto">
        <div class="input-group">
          <input type="text" class="form-control" placeholder="Search" />
          <span class="input-group-btn">
            <button class="btn btn-success">Search</button>
          </span>
        </div>
      </div>
    </div> -->
    <div class="row">
      <div class="col-md-3">
        <a href="add_vaccine.php" class="btn btn-warning btn-block">
          <i class="fa fa-plus"> Add new Vaccines</i>
        </a>
      </div>
    </div>
  </div>
</section>

<section id="posts">
  <div class="container">
    <div class="row">
      <div class="col">
        <div class="card">
          <div class="card-header">
            <h4>Latest Category</h4>
          </div>
          <table class="table table-striped">
            <thead class="thead-inverse">
              <tr>
                <th>#</th>
                <th>vaccine_name</th>
                <th>description</th>
              </tr>
            </thead>
            <tbody>
              <?php
              $results_per_page = 4;
              $query = "SELECT * FROM vaccination_description";
              $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
              $total_results = mysqli_num_rows($result);
              $total_pages = ceil($total_results / $results_per_page);

              if (!isset($_GET['page'])) {
                $page = 1;
              } else {
                $page = $_GET['page'];
              }

              $start_limit = ($page - 1) * $results_per_page;
              $query = "SELECT * FROM vaccination_description LIMIT $start_limit, $results_per_page";
              $result = mysqli_query($conn, $query) or die(mysqli_error($conn));

              if ($result && mysqli_num_rows($result) > 0) {
                while ($row = mysqli_fetch_assoc($result)) {
                  $id = $row['v_id'];
                  $vaccine_name = $row['vaccine_name'];
                  $description = $row['description'];
              ?>
                  <tr>
                    <td><?php echo $id ?></td>
                    <td><?php echo $vaccine_name ?></td>
                    <td><?php echo $description ?></td>
                    <td>
                      <a href="update_vaccine.php?id=<?php echo $id ?>" class="btn btn-secondary"><i class="fa fa-angle-double-right"> Details and Update</i></a>
                    </td>
                  </tr>
              <?php
                }
              } else {
                echo "<tr><td colspan='4'>No records found.</td></tr>";
              }
              ?>
            </tbody>
          </table>

          <!-- Pagination -->
          <ul class="pagination justify-content-center">
            <?php
            for ($page = 1; $page <= $total_pages; $page++) {
              echo "<li class='page-item'><a class='page-link' href='?page=" . $page . "'>" . $page . "</a></li>";
            }
            ?>
          </ul>

        </div>
      </div>
    </div>
  </div>
</section> 

<?php include("./parts/footer.php") ?>