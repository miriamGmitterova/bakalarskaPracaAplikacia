export async function getDoctorDetails(id) {
    try{
    const response = await fetch(`http://localhost:8080/lekar/${id}`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
    } catch (error) {
        console.error('Failed to fetch doctor details:', error);
        throw error;
    }
}