<?php include("./parts/header.php") ?>

<!-- HEADER -->
<header id="main-header" class="py-2 bg-warning text-white">
    <div class="container">
        <div class="row">
            <div class="col-md-6">
                <h1><i class="fa fa-users">Mothers</i></h1>
            </div>
        </div>
    </div>
</header>

<!-- ACTIONS BUTTONS -->
<section id="posts">
    <div class="container">
        <div class="row">
            <div class="col">
                <section id="action" class="py-4 mb-4 bg-light">
                    <div class="container">
                        <div class="row">
                            <div class="col-md-3">
                                <a href="#" class="btn btn-warning btn-block" data-toggle="modal" data-target="#addUserModal">
                                    <i class="fa fa-plus"> Add Mother</i>
                                </a>
                            </div>
                            <?php
                            if (isset($_SESSION['add'])) {
                                echo "<script>alert('" . $_SESSION['add'] . "')</script>";
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
                                <th>ID</th>
                                <th>First Name</th>
                                <th>Middle Name</th>
                                <th>Last Name</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $query = "SELECT * FROM webproject.mother_table";
                            $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
                            if (mysqli_num_rows($result) > 0) {
                                while ($row = mysqli_fetch_assoc($result)) {
                                    $id = $row['m_id'];
                                    $f_name = $row['f_name'];
                                    $m_name = $row['m_name'];
                                    $l_name = $row['l_name'];
                            ?>
                                    <tr>
                                        <td><?php echo $id; ?></td>
                                        <td><?php echo $f_name; ?></td>
                                        <td><?php echo $m_name ?></td>
                                        <td><?php echo $l_name ?></td>
                                        <td>
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <a href="update_user.php?id=<?php echo $id ?>" class="btn btn-primary btn-block"><i class="fa fa-edit"> Update </i></a>
                                                </div>
                                                <div class="col-md-6">
                                                    <a href="delete_user.php?id=<?php echo $id; ?>&fname=<?php echo $f_name; ?>" class="btn btn-danger btn-block">Delete</a>
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

<!-- USER MODAL -->
<div id="addUserModal" class="modal fade">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header bg-warning text-white">
                <h5 class="modal-title">Add Mother</h5>
                <button class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>

            <form action="add-user.php" method="post" enctype="multipart/form-data" onsubmit="return validateForm()">
                <div class="modal-body">
                    <!-- Form fields -->
                    <div class="form-group">
                        <label for="f_name">First Name</label>
                        <input type="text" class="form-control" name="f_name" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
                    </div>

                    <div class="form-group">
                        <label for="m_name">Middle Name</label>
                        <input type="text" name="m_name" class="form-control" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
                    </div>

                    <div class="form-group">
                        <label for="l_name">Last Name</label>
                        <input type="text" name="l_name" class="form-control" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
                    </div>

                    <div class="form-group">
                        <label for="birthdate">Date of Birth</label>
                        <input type="date" class="form-control" name="birthdate" required>
                    </div>

                    <div class="form-group">
                        <label for="image">Photo</label>
                        <input type="file" accept="image/*" name="image" required>
                    </div>

                    <div class="form-group">
                        <label for="blood_type">Blood Type</label>
                        <select name="blood_type" class="form-control" required>
                            <option value="">Select blood type</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="phone_number">Phone Number</label>
                        <input type="tel" id="phone_number" class="form-control" name="phone_number" required pattern="^\+251\d{2}\d{3}\d{4}$" placeholder="+251-XX-XXX-XXXX">
                    </div>

                    <div class="form-group">
                        <label for="zone">Zone</label>
                        <input type="text" name="zone" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="wereda">Wereda</label>
                        <input type="text" name="wereda" class="form-control" required>
                    </div>

                    <div class="form-group">
                        <label for="kebele">Kebele</label>
                        <input type="text" name="kebele" class="form-control" required>
                    </div>

                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                        <input type="submit" class="btn btn-warning" name="submit" value="Submit">
                    </div>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    function validateForm() {
        // Birthdate validation
        var birthdate = new Date(document.getElementById("birthdate").value);
        var today = new Date();
        if (birthdate >= today) {
            alert("Birthdate must be a past date.");
            return false;
        }
        
        // Phone number validation (Ethiopian format)
        var phone = document.getElementById("phone_number").value;
        var phonePattern = /^\+251\d{2}\d{3}\d{4}$/;
        if (!phone.match(phonePattern)) {
            alert("Please enter a valid phone number.");
            return false;
        }
        
        return true;
    }
</script>

<?php include("./parts/footer.php") ?>
