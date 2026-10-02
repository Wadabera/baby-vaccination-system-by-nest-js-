<?php include("./parts/header.php"); ?>

<?php
$mother_id_list = [];
$query = "SELECT m_id FROM webproject.mother_table";
$result = mysqli_query($conn, $query) or die(mysqli_error($conn));
$rows = mysqli_num_rows($result);
while ($row = mysqli_fetch_assoc($result)) {
    array_push($mother_id_list, $row['m_id']);
}
?>

<!-- HEADER -->
<header id="main-header" class="py-2 bg-warning text-white">
    <div class="container">
        <div class="row">
            <div class="col-md-6">
                <h1><i class="fa fa-users"></i> Children</h1>
            </div>
        </div>
    </div>
</header>

<!-- ACTIONS BUTTONS -->
<!-- <section id="action" class="py-4 mb-4 bg-light">
    <div class="container">
        <div class="row">
            <div class="col-md-6 ml-auto">
                <div class="input-group">
                    <input type="text" class="form-control" placeholder="Search">
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
                            <div class="col-md-3">
                                <a href="#" class="btn btn-warning btn-block" data-toggle="modal" data-target="#addUserModal">
                                    <i class="fa fa-plus"></i> Add Children
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
                        <h4>Registered Children</h4>
                    </div>
                    <table class="table table-striped">
                        <thead class="thead-inverse">
                            <tr>
                                <td>ID</td>
                                <th>Mother ID</th>
                                <th>First Name</th>
                                <th>Middle Name</th>
                                <th>Last Name</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php
                            $query = "SELECT * FROM webproject.child_table";
                            $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
                            $rows = mysqli_num_rows($result);
                            // check if query is successfully executed   
                            if ($rows > 0) {
                                $count = 1;
                                // check the number of data in db
                                while ($row = mysqli_fetch_assoc($result)) {
                                    $id = $row['c_id'];
                                    $m_id = $row['m_id'];
                                    $f_name = $row['f_name'];
                                    $m_name = $row["m_name"];
                                    $l_name = $row['l_name'];
                            ?>
                                    <tr>
                                        <td><?php echo $id; ?></td>
                                        <td><?php echo $m_id; ?></td>
                                        <td><?php echo $f_name; ?></td>
                                        <td><?php echo $m_name; ?></td>
                                        <td><?php echo $l_name; ?></td>
                                        <td>
                                            <div class="row">
                                                <div class="col-md-6">
                                                    <a href="update_child.php?id=<?php echo $id; ?>" class="btn btn-primary btn-block">
                                                        <i class="fa fa-plus"></i> Update
                                                    </a>
                                                </div>
                                                <div class="col-md-6">
                                                    <a href="delete_child.php?id=<?php echo $id; ?>&fname=<?php echo $f_name; ?>" class='btn btn-danger btn-block'>Delete</a>
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
                <h5 class="modal-title">Add Child</h5>
                <button class="close" data-dismiss="modal">
                    <span>&times;</span>
                </button>
            </div>
            <form id="addChildForm" action="./add-child.php" method="post" enctype="multipart/form-data" onsubmit="validateForm()">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="mother_id">Mother ID</label>
                        <select name="mother_id" id="mother_id" class="form-control">
                            <?php
                            foreach ($mother_id_list as $value) {
                            ?>
                                <option value="<?php echo $value; ?>"><?php echo $value; ?></option>
                            <?php
                            }
                            ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="name">First name</label>
                        <input type="text" class="form-control" name="f_name" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
                    </div>

                    <div class="form-group">
                        <label for="name">Middle name</label>
                        <input type="text" name="m_name" class="form-control" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
                    </div>

                    <div class="form-group">
                        <label for="name">Last name</label>
                        <input type="text" name="l_name" class="form-control" pattern="[A-Za-z]+" minlength="3" maxlength="20" required>
                    </div>
                    <div class="form-group">
                        <label for="date-of-birth">Date of Birth</label>
                        <input type="date" class="form-control" id="date-of-birth" name="birthdate" required>
                    </div>
                    <div class="form-group">
                        <label for="blood_type">Blood Type</label>
                        <select name="blood_type" class="form-control" id="blood_type" required>
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
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <input type="submit" class="btn btn-warning" name="submit" value="Submit">
                </div>
            </form>
        </div>
    </div>
</div>

<script>
    // JavaScript validation
    function validateForm() {
        var firstNameInput = document.querySelector('input[name="f_name"]');
        var middleNameInput = document.querySelector('input[name="m_name"]');
        var lastNameInput = document.querySelector('input[name="l_name"]');
        var birthdateInput = document.getElementById('date-of-birth');

        var nameRegex = /^[a-zA-Z\s]+$/;

        if (!nameRegex.test(firstNameInput.value)) {
            alert("Invalid input: First name can only contain letters.");
            event.preventDefault();
            return false;
        } else if (!nameRegex.test(middleNameInput.value)) {
            alert("Invalid input: Middle name can only contain letters.");
            event.preventDefault();
            return false;
        } else if (!nameRegex.test(lastNameInput.value)) {
            alert("Invalid input: Last name can only contain letters.");
            event.preventDefault();
            return false;
        } else {
            var birthdateInput = document.getElementById("date-of-birth").value;
            var birthdate = new Date(birthdateInput);
            var currentDate = new Date();
            var minAgeDate = new Date();
            minAgeDate.setFullYear(currentDate.getFullYear() - 2);

            if (birthdate > currentDate || birthdate < minAgeDate) {
                alert("Please enter a valid birthdate that is at most 2 years.");
                event.preventDefault();
                return false;
            }
        }
    }
</script>

<!-- CUSTOM CSS TO MAKE LABELS VISIBLE -->
<style>
    label {
        color: #495057; /* Text color */
        font-weight: bold;
        margin-bottom: 5px;
        display: block;
    }

    input, select {
        border-radius: 5px;
        padding: 10px;
        margin-bottom: 15px;
    }

    .form-group {
        margin-bottom: 20px;
    }
</style>

<?php include("./parts/footer.php"); ?>  
