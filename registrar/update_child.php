<?php
// Start output buffering to prevent headers already sent errors
ob_start();

// Include required files
require_once("./parts/header.php");
require_once("../config/constant.php");

// Check for the update operation
if (isset($_POST['updatechild'])) {
    // Sanitize input
    $id = $_POST['id'];
    $m_id = $_POST['m_id'];
    $f_name = $_POST['f_name'];
    $m_name = $_POST['m_name'];
    $l_name = $_POST['l_name'];
    $birthdate = $_POST['birthdate'];
    $blood_type = $_POST['blood_type'];

    // Update query
    $query = "UPDATE webproject.child_table SET m_id='$m_id', f_name='$f_name', m_name='$m_name', l_name='$l_name', bithdate='$birthdate', blood_type='$blood_type' WHERE c_id='$id'";

    if (mysqli_query($conn, $query)) {
        $_SESSION['add'] = "Child data updated successfully!";
        header("Location: children.php");  // Redirect to children.php
        exit();  // Stop further execution after the header redirection
    } else {
        $_SESSION['add'] = "Failed to update child data!";
    }
}

$id = $_GET['id'];
$mother_id_list = [];
$query = "SELECT m_id FROM webproject.mother_table";
$result = mysqli_query($conn, $query) or die(mysqli_error($conn));
while ($row = mysqli_fetch_assoc($result)) {
    $mother_id_list[] = $row['m_id'];
}

$query = "SELECT * FROM webproject.child_table WHERE c_id='$id'";
$result = mysqli_query($conn, $query) or die(mysqli_error($conn));
if (mysqli_num_rows($result) > 0) {
    $row = mysqli_fetch_assoc($result);
    $m_id = $row['m_id'];
    $f_name = $row['f_name'];
    $m_name = $row['m_name'];
    $l_name = $row['l_name'];
    $birthdate = $row['bithdate'];
    $blood_type = $row['blood_type'];
}
?>

<!-- USER MODAL -->
<div class="modal-dialog modal-lg">
    <div class="modal-content">
        <div class="modal-header bg-warning text-white">
            <h5 class="modal-title">Update Child</h5>
            <a href='./children.php' class="close" data-dismiss="modal">
                <span>&times;</span>
            </a>
        </div>

        <?php
        if (isset($_SESSION['add'])) {
            echo "<script>alert('" . $_SESSION['add'] . "')</script>";
            unset($_SESSION['add']);
        }
        ?>

        <form action='update_child_data.php' method='post' enctype='multipart/form-data'>
            <div class="modal-body">
                <div class="form-group">
                    <input type="hidden" class="form-control" name='id' value='<?php echo $id ?>' />
                </div>

                <div class="form-group">
                    <label for="name">Mother ID</label>
                    <select name="m_id" id="mother_id" class="form-control">
                        <?php
                        foreach ($mother_id_list as $value) {
                            echo "<option value='$value'" . ($m_id == $value ? " selected" : "") . ">$value</option>";
                        }
                        ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="name">First Name</label>
                    <input type="text" value='<?php echo $f_name ?>' class="form-control" name='f_name' />
                </div>

                <div class="form-group">
                    <label for="name">Middle Name</label>
                    <input type="text" value='<?php echo $m_name ?>' name='m_name' class="form-control" />
                </div>

                <div class="form-group">
                    <label for="name">Last Name</label>
                    <input type="text" value='<?php echo $l_name ?>' name='l_name' class="form-control" />
                </div>

                <div class="form-group">
                    <label for="date-of-birth">Date of Birth</label>
                    <input type="date" value='<?php echo $birthdate ?>' class="form-control" id="date-of-birth" name="birthdate" required />
                </div>

                <div class="form-group">
                    <label for="name">Blood Type</label>
                    <select name="blood_type" class="form-control" id="blood_type">
                        <option value="A+" <?php if ($blood_type == "A+") echo "selected"; ?>>A+</option>
                        <option value="A-" <?php if ($blood_type == "A-") echo "selected"; ?>>A-</option>
                        <option value="B+" <?php if ($blood_type == "B+") echo "selected"; ?>>B+</option>
                        <option value="B-" <?php if ($blood_type == "B-") echo "selected"; ?>>B-</option>
                        <option value="AB+" <?php if ($blood_type == "AB+") echo "selected"; ?>>AB+</option>
                        <option value="AB-" <?php if ($blood_type == "AB-") echo "selected"; ?>>AB-</option>
                        <option value="O+" <?php if ($blood_type == "O+") echo "selected"; ?>>O+</option>
                        <option value="O-" <?php if ($blood_type == "O-") echo "selected"; ?>>O-</option>
                    </select>
                </div>

                <div class="modal-footer">
                    <label for=""><a href="children.php">Close</a></label>
                    <input type="submit" class="btn btn-warning" name='updatechild' value="Update">
                </div>
            </div>
        </form>
    </div>
</div>

<!-- Optional JavaScript -->
<?php include("./parts/footer.php"); ?>

<?php
// End output buffering
ob_end_flush();
?>   
