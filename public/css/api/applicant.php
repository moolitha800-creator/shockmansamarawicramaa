<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST");

$db_file = __DIR__ . '/../auction_db.json';

// Ensure DB exists
if (!file_exists($db_file)) {
    file_put_contents($db_file, json_encode(["applicants" => []]));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
        $data = json_decode(file_get_contents($db_file), true);
        $applicant = null;

        foreach ($data['applicants'] as $a) {
            if ($a['applicant_id'] === $id) {
                $applicant = $a;
                break;
            }
        }

        if ($applicant) {
            echo json_encode(["success" => true, "data" => $applicant]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "message" => "Applicant not found"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "ID is required"]);
    }
} elseif ($method === 'POST') {
    // ProFreeHost / PHP File Upload
    $vehicle_image_path = "";
    
    if (isset($_FILES['vehicle_image_file']) && $_FILES['vehicle_image_file']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = __DIR__ . '/../uploads/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        $tmp_name = $_FILES['vehicle_image_file']['tmp_name'];
        $name = basename($_FILES['vehicle_image_file']['name']);
        $unique_name = time() . '-' . rand(1000, 9999) . '-' . $name;
        $destination = $upload_dir . $unique_name;

        if (move_uploaded_file($tmp_name, $destination)) {
            $vehicle_image_path = 'uploads/' . $unique_name;
        }
    }

    $applicant_id = $_POST['applicant_id'] ?? '';
    if (empty($applicant_id)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Applicant ID is required."]);
        exit;
    }

    // if image was passed as URL text instead of file
    if (empty($vehicle_image_path)) {
        $vehicle_image_path = $_POST['vehicle_image'] ?? '';
    }

    $newApplicant = [
        "applicant_id" => $applicant_id,
        "name" => $_POST['name'] ?? '',
        "address" => $_POST['address'] ?? '',
        "refundable_deposit" => $_POST['refundable_deposit'] ?? 0,
        "vehicle_category" => $_POST['vehicle_category'] ?? '',
        "vehicle_registration_number" => $_POST['vehicle_registration_number'] ?? '',
        "mileage" => $_POST['mileage'] ?? '',
        "vehicle_image" => $vehicle_image_path,
        "auction_date" => $_POST['auction_date'] ?? '',
        "auction_category_start_date" => $_POST['auction_category_start_date'] ?? '',
        "starting_bid" => $_POST['starting_bid'] ?? 0,
        "id" => time() * 1000
    ];

    $data = json_decode(file_get_contents($db_file), true);

    $updated = false;
    foreach ($data['applicants'] as $key => $a) {
        if ($a['applicant_id'] === $newApplicant['applicant_id']) {
            // Keep original ID timestamp if it exists
            $newApplicant['id'] = $a['id'];
            // Keep original image if new one wasn't uploaded
            if (empty($vehicle_image_path) && empty($_POST['vehicle_image'])) {
                $newApplicant['vehicle_image'] = $a['vehicle_image'];
            }
            $data['applicants'][$key] = $newApplicant;
            $updated = true;
            break;
        }
    }

    if (!$updated) {
        $data['applicants'][] = $newApplicant;
    }
    
    file_put_contents($db_file, json_encode($data, JSON_PRETTY_PRINT));

    http_response_code(201);
    echo json_encode(["success" => true, "id" => $newApplicant['id'], "action" => $updated ? "updated" : "created"]);
} elseif ($method === 'DELETE') {
    if (isset($_GET['id'])) {
        $id = $_GET['id'];
        $data = json_decode(file_get_contents($db_file), true);
        $initialCount = count($data['applicants']);
        
        $data['applicants'] = array_filter($data['applicants'], function($a) use ($id) {
            return $a['applicant_id'] !== $id;
        });
        
        if (count($data['applicants']) < $initialCount) {
            $data['applicants'] = array_values($data['applicants']); // re-index
            file_put_contents($db_file, json_encode($data, JSON_PRETTY_PRINT));
            echo json_encode(["success" => true, "message" => "Deleted successfully"]);
        } else {
            http_response_code(404);
            echo json_encode(["success" => false, "error" => "Applicant not found"]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "ID is required"]);
    }
} elseif ($method === 'GET' && !isset($_GET['id'])) {
    // Return all applicants if no ID is specified
    $data = json_decode(file_get_contents($db_file), true);
    echo json_encode(["success" => true, "data" => $data['applicants']]);
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Method not allowed"]);
}
?>
