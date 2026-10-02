<?php include("./parts/header.php"); ?>

<?php 
$c_id = $_GET['id']; 
$query = "SELECT * FROM webproject.child_table WHERE c_id = $c_id"; 
$result = mysqli_query($conn, $query) or die(mysqli_error($conn)); 

// Initialize variables with default values to avoid warnings
$f_name = $m_name = $l_name = $birthdate = $blood_type = $m_id = '';
$r1 = $r2 = $r3 = $r4 = $r5 = 0; // Default value of 0

if ($result) { 
    while ($rows = mysqli_fetch_assoc($result)) { 
        $f_name = $rows['f_name']; 
        $m_name = $rows['m_name']; 
        $l_name = $rows['l_name']; 
        $birthdate = $rows['bithdate']; 
        $blood_type = $rows['blood_type']; 
        $m_id = $rows['m_id']; 
    } 
}

// Check if the form is submitted and if the values are set
if (isset($_POST["vacinate"])) {
    $c_id = $_POST["c_id"];
    $r1 = $_POST["r1"];
    $r2 = $_POST["r2"];
    $r3 = $_POST["r3"];
    $r4 = $_POST["r4"];
    $r5 = $_POST["r5"];
    
    $query1 = "UPDATE `webproject`.`child_vaccine` 
                 SET r1='$r1', r2='$r2', r3='$r3', r4='$r4', r5='$r5'
                 WHERE c_id='$c_id'";
    
    $result1 = mysqli_query($conn, $query1) or die(mysqli_error($conn));
    if ($result1) {
        $_SESSION["add"] = $m_id . " successfully added";
        echo $_SESSION['add'];
        unset($_SESSION['add']);
    } else {
        $_SESSION["add"] = $m_id . " failed to add";
        echo $_SESSION['add'];
        unset($_SESSION['add']);
    }
}
?>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    html, body {
        height: 100%;
        font-family: 'Times New Roman', Times, serif;
        background-color: #f4f4f4; /* Light background color */
        color: #333; /* Dark text color for contrast */
    }

    .wrapper {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    header {
        background-color: #2C3E50; /* Dark header */
        padding: 20px;
        text-align: center;
        color: white;
        font-size: 28px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow for the header */
        position: relative;
        z-index: 10;
    }

    footer {
        background-color: #2C3E50; /* Dark footer */
        color: white;
        text-align: center;
        padding: 10px;
        position: relative;
        z-index: 10;
        margin-top: auto;
        box-shadow: 0 -4px 6px rgba(0, 0, 0, 0.1); /* Subtle shadow for the footer */
    }

    .content {
        flex-grow: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 30px;
    }

    .profile-container {
        background-color: #fff; /* White background for profile container */
        border-radius: 10px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); /* Soft shadow for the profile container */
        padding: 40px;
        max-width: 600px;
        width: 100%;
        text-align: center;
        margin-top: 20px;
    }

    h2 {
        font-size: 24px;
        margin-bottom: 20px;
        color: #2C3E50; /* Dark color for headings */
    }

    .profile-table td {
        padding: 10px;
        font-size: 16px;
        color: #555; /* Lighter color for table content */
    }

    .btn-primary, .btn-secondary {
        display: inline-block;
        padding: 10px 20px;
        font-size: 16px;
        font-weight: bold;
        text-decoration: none;
        border-radius: 6px;
        transition: background-color 0.3s ease, transform 0.3s ease;
    }

    .btn-primary {
        color: #fff;
        background-color: #3498db; /* Blue button */
    }

    .btn-primary:hover {
        background-color: #2980b9; /* Darker blue on hover */
        transform: translateY(-2px); /* Slightly raise the button */
    }

    .btn-secondary {
        color: #2C3E50;
        background-color: #ecf0f1; /* Light grey button */
        margin-right: 10px;
    }

    .btn-secondary:hover {
        background-color: #bdc3c7; /* Darker grey on hover */
        transform: translateY(-2px); /* Slightly raise the button */
    }

    /* Overlay and Popup Styles */
    .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 999;
        display: none;
    }

    .popup {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); /* Soft shadow for popups */
        padding: 40px;
        max-width: 500px;
        width: 100%;
        text-align: center;
        z-index: 1000;
        display: none;
    }

    #popup select {
        margin-bottom: 10px;
        padding: 8px;
        font-size: 14px;
        border-radius: 4px;
        border: 1px solid #ccc;
    }

</style>

<div class="wrapper">
    <!-- Header Section -->
    <header>
        <h1>Child Profile</h1>
    </header>

    <!-- Content Section -->
    <div class="content">
        <div class="profile-container">
            <h2>Child Details</h2>
            <div class="profile-table">
                <table>
                    <tr>
                        <td><strong>First Name:</strong></td>
                        <td><?php echo $f_name; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Middle Name:</strong></td>
                        <td><?php echo $m_name; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Last Name:</strong></td>
                        <td><?php echo $l_name; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Birthdate:</strong></td>
                        <td><?php echo $birthdate; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Blood Type:</strong></td>
                        <td><?php echo $blood_type; ?></td>
                    </tr>
                    <tr>
                        <td><strong>Mother Id:</strong></td>
                        <td><?php echo $m_id; ?></td>
                    </tr>
                </table>
            </div>
            <div>
                <a href="./mother_detail.php?id=<?php echo $m_id; ?>" class="btn-primary">View Mother</a>
                <button onclick="showPopup()" class="btn-primary">Vaccination Information</button>
            </div>
        </div>
    </div>

    <!-- Footer Section -->
    <footer>
        <p>© 2025 Child Profile System. All Rights Reserved.</p>
    </footer>

    <!-- Vaccination Information Popup -->
    <div class="overlay" id="overlay"></div>
    <div class="popup" id="popup">
        <h2>Vaccination Information</h2>
        <form method="POST" action="#">
            <input type="hidden" name="c_id" value="<?php echo $c_id; ?>">
            <label for="r1">r1:</label>
            <select name="r1" id="r1">
                <option value="1" <?php echo ($r1 == 1) ? "selected" : ""; ?>>Yes</option>
                <option value="0" <?php echo ($r1 == 0) ? "selected" : ""; ?>>No</option>
            </select>
            <br>
            <label for="r2">r2:</label>
            <select name="r2" id="r2">
                <option value="1" <?php echo ($r2 == 1) ? "selected" : ""; ?>>Yes</option>
                <option value="0" <?php echo ($r2 == 0) ? "selected" : ""; ?>>No</option>
            </select>
            <br>
            <label for="r3">r3:</label>
            <select name="r3" id="r3">
                <option value="1" <?php echo ($r3 == 1) ? "selected" : ""; ?>>Yes</option>
                <option value="0" <?php echo ($r3 == 0) ? "selected" : ""; ?>>No</option>
            </select>
            <br>
            <label for="r4">r4:</label>
            <select name="r4" id="r4">
                <option value="1" <?php echo ($r4 == 1) ? "selected" : ""; ?>>Yes</option>
                <option value="0" <?php echo ($r4 == 0) ? "selected" : ""; ?>>No</option>
            </select>
            <br>
            <label for="r5">r5:</label>
            <select name="r5" id="r5">
                <option value="1" <?php echo ($r5 == 1) ? "selected" : ""; ?>>Yes</option>
                <option value="0" <?php echo ($r5 == 0) ? "selected" : ""; ?>>No</option>
            </select>
            <br>
            <input type="submit" value="Save" name="vacinate">
            <button onclick="hidePopup()" type="button">Cancel</button>
        </form>
    </div>
</div>

<script>
    function showPopup() {
        document.getElementById("overlay").style.display = "block";
        document.getElementById("popup").style.display = "block";
    }

    function hidePopup() {
        document.getElementById("overlay").style.display = "none";
        document.getElementById("popup").style.display = "none";
    }
</script>

<?php include("./parts/footer.php"); ?>
