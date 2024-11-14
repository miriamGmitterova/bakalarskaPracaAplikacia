
export async function getDoctors() {
    const response = await fetch(`http://localhost:8080/lekar/zoznam`); // Adjust this URL to your backend endpoint
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();

}








