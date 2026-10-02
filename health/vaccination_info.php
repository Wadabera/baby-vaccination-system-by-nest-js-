<?php
include("./parts/header.php");
?>

<!DOCTYPE html>
<html>
<head>
    <title>Mother Profile</title>
    <style>
        /* ...existing styles... */

        .overlay {
            display: none;
            position: fixed;
            z-index: 999;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
        }

        .popup {
            display: none;
            position: fixed;
            z-index: 1000;
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            padding: 20px;
            max-width: 500px;
            width: 100%;
            text-align: center;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        
        /* ...existing styles... */
    </style>
</head>
<body>
    <div class="profile-container">
        <!-- ...existing code... -->

        <div>
            <a href="child_list.php?m_id=<?php echo $m_id; ?>" class="btn-primary">Child List</a>
            <button onclick="showPopup()" class="btn-primary">Vaccination Information</button>
        </div>
    </div>

    <div class="overlay" id="overlay"></div>

    <div class="popup" id="popup">
        <h2>Vaccination Information</h2>
        <form method="POST" action="process_vaccination.php">
            <input type="hidden" name="m_id" value="<?php echo $m_id; ?>">
            <label for="tt1">TT1:</label>
            <input type="number" name="tt1" id="tt1">
            <br>
            <label for="tt2">TT2:</label>
            <input type="number" name="tt2" id="tt2">
            <br>
            <label for="tt3">TT3:</label>
            <input type="number" name="tt3" id="tt3">
            <br>
            <label for="tt4">TT4:</label>
            <input type="number" name="tt4" id="tt4">
            <br>
            <label for="tt5">TT5:</label>
            <input type="number" name="tt5" id="tt5">
            <br>
            <label for="rh">RH:</label>
            <input type="number" name="rh" id="rh">
            <br>
            <input type="submit" value="Save">
            <button onclick="hidePopup()" type="button">Cancel</button>
        </form>
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

    <?php include('./parts/footer.php'); ?>
</body>
</html>
