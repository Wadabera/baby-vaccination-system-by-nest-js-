<?php include("./parts/header.php") ?>

<!--HEADER -->
<header id="main-header" class="py-2 bg-warning text-white">
  <div class="container">
    <div class="row">
      <div class="col-md-6">
        <h1><i class="fa fa-users">Mothers</i></h1>
      </div>
    </div>
  </div>
</header>
<!--ACTIONS BUTTONS-->

<!-- <section id="action" class="py-4 mb-4 bg-light">
<div class="container">
<div class="row">
 <div class="col-md-6 ml-auto">
     <div class="input-group">
         <input type="text" class="form-control" placeholder="search">
         <span class="input-group-btn">
             <button class="btn btn-warning">Search</button>
         </span>
     </div>
 </div>
</div>
</div>
</section> -->

<section id="posts">
  <div class="container">
    <div class="row">
      <div class="col">
        <section id="action" class="py-4 mb-4 bg-light">
          <div class="container">
            <div class="row">

              <?php
              if (isset($_SESSION['add'])) {
                echo "<h1 class='error'>" . $_SESSION['add'] . "</h1>";
                unset($_SESSION['add']);
              }

              ?>

            </div>
          </div>
        </section>
        <div class="card">
          <div class="card-header">
            <h4>Registered Mothers</h4>
          </div>
          <table class="table table-striped">
            <thead class="thead-inverse">
              <tr>
                <td>id</td>
                <th>First name</th>
                <th>Middle name</th>
                <th>Last name</th>
              </tr>
            </thead>
            <tbody>
              <?php
              $query = "SELECT * FROM webproject.mother_table";
              $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
              $rows = mysqli_num_rows($result);
              // check if query is successfully excuted   
              if ($rows > 0) {
                $count = 1;
                // check the numbers of data in db
                while ($rows = mysqli_fetch_assoc($result)) {
                  $id = $rows['m_id'];
                  $f_name = $rows['f_name'];
                  $m_name = $rows["m_name"];
                  $l_name = $rows['l_name'];
              ?>
                  <tr>
                    <td><?php echo $id; ?></td>
                    <td><?php echo $f_name; ?></td>
                    <td><?php echo $m_name ?></td>
                    <td><?php echo $l_name ?></td>
                    <td>

                      <div class="row">
                        <div class="col-md-6">
                          <a href="./mother_detail.php?id=<?php echo $id ?>" class="btn btn-primary btn-block"><i class="fa fa-plus">Profile & vaccine</i>
                          </a>
                        </div>


                      </div>
                    </td>
                  </tr>

              <?php

                }
              }


              ?>
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