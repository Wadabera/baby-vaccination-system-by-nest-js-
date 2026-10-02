<?php
// Start output buffering at the very beginning of your file
ob_start(); 

// Include header file (this may have some output)
include("./parts/header.php");

// Your code logic...
$id = $_GET['id'];

?>

<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://unpkg.com/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>

<!--USER MODAL-->
<div class="modal-dialog modal-lg">
  <div class="modal-content">
    <div class="modal-header bg-warning text-white">
      <h5 class="modal-title">Update User</h5>
      <button class="close" data-dismiss="modal">
        <span>&times;</span>
      </button>
    </div>
    <?php
    if (isset($_SESSION['add'])) {
      echo "<script>alert('" . $_SESSION['add'] . "')</script>";
      unset($_SESSION['add']);
    }
    ?>

    <?php
    $query = "SELECT * FROM webproject.mother_table where m_id='$id'";
    $result = mysqli_query($conn, $query) or die(mysqli_error($conn));
    $rows = mysqli_num_rows($result);
    if ($rows > 0) {
      while ($rows = mysqli_fetch_assoc($result)) {
        $f_name = $rows['f_name'];
        $m_name = $rows["m_name"];
        $l_name = $rows['l_name'];
        $birthdate = $rows['bithdate'];
        $image_name = $rows['photo_url'];
        $blood_type = $rows['blood_type'];
        $phone_number = $rows['m_phone'];
        $zone = $rows['zone'];
        $wereda = $rows['wereda'];
        $kebele = $rows['kebele'];
    ?>
        <form action='update_user_data.php' method='post' enctype='multipart/form-data' id="updateUserForm">
          <div class="modal-body">
            <div class="form-group">
              <input type="hidden" class="form-control" name='id' value='<?php echo $id ?>' />
            </div>
            <div class="form-group">
              <label for="name">First name</label>
              <input type="text" value='<?php echo $f_name ?>' class="form-control" name='f_name' required />
            </div>
            <div class="form-group">
              <label for="name">Middle name</label>
              <input type="text" value='<?php echo $m_name ?>' name='m_name' class="form-control" required />
            </div>
            <div class="form-group">
              <label for="name">Last name</label>
              <input type="text" value='<?php echo $l_name ?>' name='l_name' class="form-control" required />
            </div>
            <div class="form-group">
              <label for="date-of-birth">Date of Birth</label>
              <input type="date" value='<?php echo $birthdate; ?>' class="form-control" id="date-of-birth" name="birthdate" required>
            </div>
            <div class="form-group">
              <label for="name">Blood type</label>
              <select name="blood_type" class="form-control" id="blood_type" required>
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
            <div class="form-group">
              <label for="name">Phone number</label>
              <input type="text" value='<?php echo $phone_number ?>' name='phone_number' class="form-control" required />
            </div>
            <div class="form-group">
              <label for="name">Zone</label>
              <input type="text" value='<?php echo $zone ?>' name='zone' class="form-control" required />
            </div>
            <div class="form-group">
              <label for="name">Wereda</label>
              <input type="text" value='<?php echo $wereda ?>' name='wereda' class="form-control" required />
            </div>
            <div class="form-group">
              <label for="name">Kebele</label>
              <input type="text" value='<?php echo $kebele; ?>' name='kebele' class="form-control" required />
            </div>
          </div>
          <div class="modal-footer">
            <label for=""><a href="mother.php">Close</a></label>
            <input type="submit" class="btn btn-warning" name='updatemother' value="Update">
          </div>
        </form>
    <?php
      }
    }
    ?>
  </div>
</div>

<script>
  // JavaScript validation
  document.getElementById('updateUserForm').addEventListener('submit', function(event) {
    var firstNameInput = document.querySelector('input[name="f_name"]');
    var middleNameInput = document.querySelector('input[name="m_name"]');
    var lastNameInput = document.querySelector('input[name="l_name"]');
    var birthdateInput = document.getElementById('date-of-birth');
    var bloodTypeInput = document.getElementById('blood_type');
    var phoneNumberInput = document.querySelector('input[name="phone_number"]');
    var zoneInput = document.querySelector('input[name="zone"]');
    var weredaInput = document.querySelector('input[name="wereda"]');
    var kebeleInput = document.querySelector('input[name="kebele"]');

    var nameRegex = /^[a-zA-Z\s]+$/;
    var phoneRegex = /^\+251\d{2}\d{3}\d{4}$/;

    if (!nameRegex.test(firstNameInput.value)) {
      alert("Invalid input: First name can only contain letters.");
      event.preventDefault();
    } else if (!nameRegex.test(middleNameInput.value)) {
      alert("Invalid input: Middle name can only contain letters.");
      event.preventDefault();
    } else if (!nameRegex.test(lastNameInput.value)) {
      alert("Invalid input: Last name can only contain letters.");
      event.preventDefault();
    } else if (new Date(birthdateInput.value) > new Date()) {
      alert("Invalid input: Birth date cannot be in the future.");
      event.preventDefault();
    } else if (new Date(birthdateInput.value) > new Date().setFullYear(new Date().getFullYear() - 10)) {
      alert("Invalid input: Birth date must be at least 10 years ago.");
      event.preventDefault();
    } else if (!phoneRegex.test(phoneNumberInput.value)) {
      alert("Please enter a valid phone number in the format +251-XX-XXX-XXXX.");
      event.preventDefault();
    } else if (!nameRegex.test(zoneInput.value)) {
      alert("Invalid input: Zone can only contain letters.");
      event.preventDefault();
    } else if (!nameRegex.test(weredaInput.value)) {
      alert("Invalid input: Wereda can only contain letters.");
      event.preventDefault();
    } else if (!nameRegex.test(kebeleInput.value)) {
      alert("Invalid input: Kebele can only contain letters.");
      event.preventDefault();
    }
  });
</script>

<?php
// Include footer (also ensure no output before the PHP code)
include("./parts/footer.php");

// End output buffering at the very end of your file
ob_end_flush();
?>
