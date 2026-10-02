<?php
// Database connection
$host = "localhost";
$username = "root"; // Change if using a different username
$password = ""; // Change if your database has a password
$database = "webproject";

$conn = new mysqli($host, $username, $password, $database);

// Check the connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Handle Registration
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['register'])) {
    $f_name = $_POST['f_name'];
    $m_name = $_POST['m_name'];
    $l_name = $_POST['l_name'];
    $username = $_POST['username'];
    $password = password_hash($_POST['password'], PASSWORD_BCRYPT); // Secure password
    $phone_number = $_POST['phone_number'];
    $email = $_POST['email'];
    $role = $_POST['role'];

    // Handle File Upload
    $image_url = "";
    if (isset($_FILES['image_url']) && $_FILES['image_url']['error'] == 0) {
        $target_dir = "uploads/";
        if (!is_dir($target_dir)) {
            mkdir($target_dir, 0777, true);
        }
        $image_url = $target_dir . basename($_FILES["image_url"]["name"]);
        move_uploaded_file($_FILES["image_url"]["tmp_name"], $image_url);
    }

    try {
        // Insert into Database
        $stmt = $conn->prepare("INSERT INTO users (f_name, m_name, l_name, username, password, phone_number, email, role, image_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssssssss", $f_name, $m_name, $l_name, $username, $password, $phone_number, $email, $role, $image_url);

        if ($stmt->execute()) {
            $message = "Registration successful!";
            $message_type = "success";
        } else {
            throw new Exception("Error: " . $stmt->error);
        }
        $stmt->close();
    } catch (Exception $e) {
        $message = "Registration failed! " . $e->getMessage();
        $message_type = "error";
    }
}
$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <style>
        body {
            background: linear-gradient(135deg, #0D92F4, #578FCA, #37AFE1);
            background-size: cover;
            background-repeat: no-repeat;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            animation: fadeIn 2s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .gradient-bg {
            background: linear-gradient(135deg, #A1E3F9, #0D92F4, #578FCA, #48A6A7, #006BFF, #37AFE1);
            color: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            animation: slideUp 1s ease-in-out;
            width: 570px;
        }
        @keyframes slideUp {
            from { transform: translateY(50px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        .neon-text {
            color: #fff;
            text-shadow: 0 0 5px #0D92F4, 0 0 10px #0D92F4, 0 0 15px #0D92F4;
        }
        .hover-effect:hover {
            transition: all 0.3s ease;
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
        }
        .login-btn {
            font-size: 1.2rem;
            font-weight: bold;
            padding: 10px 20px;
            background: linear-gradient(135deg, #6aa9ff, #5b8bd6);
            color: white;
            border-radius: 30px;
            display: block;
            text-align: center;
            text-decoration: none;
            transition: all 0.3s ease-in-out;
            margin-top: 15px;
        }
        .login-btn:hover {
            background: linear-gradient(135deg, #5b8bd6, #4872b8);
            transform: scale(1.1);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }
        input, select {
            background-color: rgba(255, 255, 255, 0.9); /* Ensures visibility */
            color: #333; /* Dark text for readability */
            padding: 10px;
        }
        /* Popup Styling */
       #popup {
    display: none;
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 10px 20px;
    background-color: #28a745; /* Green background for success */
    color: white;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    font-size: 16px;
}

#popup.error {
    background-color: #dc3545; /* Red background for error */
}

#popup.show {
    display: block;
}

        .error {
            background-color: #dc3545 !important;
        }
        .success {
            background-color: #28a745 !important;
        }
    </style>
</head>
<body>
    <div class="gradient-bg w-full max-w-xl p-8 space-y-6">
        <h2 class="text-2xl font-bold text-center neon-text">Register</h2>
        <form action="" method="POST" enctype="multipart/form-data" class="space-y-4" onsubmit="return validateForm()">
            <input type="text" name="f_name" placeholder="First Name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400">
            <input type="text" name="m_name" placeholder="Middle Name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400">
            <input type="text" name="l_name" placeholder="Last Name" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400">
            <input type="text" name="username" placeholder="Username" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400">
            <input type="password" name="password" placeholder="Password" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400">
            <input type="text" name="phone_number" placeholder="Phone Number" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400">
            <input type="email" name="email" placeholder="Email" required class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400">
            <select name="role" required class="w-full px-4 py-2 border rounded-lg">
                <option value="">Select Role</option>
                <option value="Admin">Doctor</option>
                <option value="User">User</option>
                
            </select>

            <button type="submit" name="register" class="w-full py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 hover-effect">Register</button>
        </form>
        <a href="login.php" class="login-btn">Already have an account? Login</a>
    </div>

    <!-- Displaying Popup Message -->
   <?php
// Assuming the registration process has been handled
if (isset($registration_success) && $registration_success) {
    $message = "Registration successful!";
    $message_type = "success"; // You can use "error" or "info" depending on the message
}
?>

<!-- Popup message -->
<div id="popup" class="<?= isset($message_type) ? $message_type : '' ?> <?= isset($message) ? 'show' : '' ?>">
    <?= isset($message) ? $message : '' ?>
</div>


    <script>
        // Display the popup if there's a message
       // Display the popup if there's a message
       // Check if the popup has already been shown in the current session
// Function to show the popup
function showPopup(message, type) {
    let popup = document.getElementById("popup");

    // Set message and type
    popup.textContent = message;
    popup.classList.add(type, 'show');

    // Set session storage to track if the popup has been shown
    sessionStorage.setItem('popupShown', 'true');

    // Hide popup after 5 seconds
    setTimeout(() => {
        popup.classList.remove('show');
    }, 5000);
}

// Check if the popup has already been shown during this session
if (!sessionStorage.getItem('popupShown')) {
    // The popup hasn't been shown, so call showPopup function
    showPopup('Registration successful!', 'success');
} else {
    // The popup was already shown, so hide it immediately
    document.getElementById('popup').classList.remove('show');
}



        function validateForm() {
            let form = document.querySelector('form');
            let password = form.password.value;
            let email = form.email.value;
            let phone = form.phone_number.value;

            let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
            let phonePattern = /^(?:\+251|251)(9\d{8})$/;

    if (!email.match(emailPattern)) {
    showPopup('Please enter a valid email address.', 'error');
    return false;
}

if (!phone.match(phonePattern)) {
    showPopup('Phone number must be 10 digits, starting with 9.', 'error');
    return false;
}

            return true;
        }

        // Function to show popup
        
    </script>
</body>
</html>
