import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; 
import { supabase } from './supabaseClient';
import logo from './logo.jpg';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSignOutAlt, 
    faTimes, 
    faTrash, 
    faPlus, 
    faEdit,
    faBoxOpen, 
    faShoppingCart, 
    faComments,
    faSpinner
} from '@fortawesome/free-solid-svg-icons';
import AdminChatModal from './AdminChatModal';

const Admin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [products, setProducts] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [activeOrders, setActiveOrders] = useState(0);
    const [pendingChats, setPendingChats] = useState(0);
    const [loginError, setLoginError] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

        // NEW LOADING STATES
        const [isLoading, setIsLoading] = useState({
            login: false,
            products: false,
            addProduct: false,
            deleteProduct: false,
            uploadSlide: false
        });
    
    

        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, (user) => {
                if (user) {
                    setIsAdmin(true);
                    loadExistingProducts();
                    updateStats();
                } else {
                    setIsAdmin(false);
                }
            });
    
            const fetchProducts = async () => {
                setIsLoading(prev => ({ ...prev, products: true }));
                const { data, error } = await supabase.from('Products').select('*');
                if (error) {
                    console.error('Error fetching products:', error);
                } else {
                    setProducts(data);
                    setTotalProducts(data.length);
                }
                setIsLoading(prev => ({ ...prev, products: false }));
            };
    
            fetchProducts();
    
            return () => unsubscribe();

        const handleResize = () => {
            setIsMobileView(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check local storage or system preference
        const savedMode = localStorage.getItem('darkMode');
        return savedMode === 'true' || 
               (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        setIsLoading(prev => ({ ...prev, login: true }));
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error("Login error:", error);
            setLoginError(error.message || "Invalid credentials. Please try again.");
        } finally {
            setIsLoading(prev => ({ ...prev, login: false }));
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const loadExistingProducts = () => {
        // Already handled by Supabase fetchProducts
    };

    const scrollToManageProducts = () => {
        const manageProductsSection = document.querySelector('.bg-white.rounded-lg.shadow-xl.p-4.md\\:p-6:nth-child(3)');
        if (manageProductsSection) {
            manageProductsSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleActiveOrdersClick = () => {
        alert('Active Orders section is coming soon!');
    };

    const handleAddOrUpdateProduct = async (e) => {
        e.preventDefault();
        setIsLoading(prev => ({ ...prev, addProduct: true }));
        const fileInput = document.getElementById('productImage');
        const file = fileInput.files[0];
        const productName = document.getElementById('productName').value;
        const productPrice = parseFloat(document.getElementById('productPrice').value);
        const productCategory = document.getElementById('productCategory').value;
        const productStatus = document.getElementById('productStatus').value;
        const productDescription = document.getElementById('productDescription').value;
    
        let imageUrl = editingProduct ? editingProduct.image : ''; // Use existing image if editing
    
        // Upload image only if a new file is selected
        if (file) {
            const fileName = `${Date.now()}_${file.name}`;
            const {  uploadData, error: uploadError } = await supabase.storage
                .from('images')
                .upload(`products/${fileName}`, file);
    
            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                setIsLoading(prev => ({ ...prev, addProduct: false }));
                return;
            }
    
            // Correctly get the public URL
            const {  urlData } = supabase.storage
                .from('images')
                .getPublicUrl(`products/${fileName}`);
    
            // Make sure to access publicUrl correctly
            imageUrl = urlData?.publicUrl || urlData?.url;
    
            if (!imageUrl) {
                console.error('Could not retrieve public URL');
                setIsLoading(prev => ({ ...prev, addProduct: false }));
                return;
            }
        }
    
        const newProduct = {
            name: productName,
            price: productPrice,
            category: productCategory,
            status: productStatus,
            description: productDescription,
            image: imageUrl, // This will be the new image or the existing image
        };
    
        try {
            if (editingProduct) {
                await supabase.from('Products').update(newProduct).eq('id', editingProduct.id);
                setEditingProduct(null);
            } else {
                await supabase.from('Products').insert([newProduct]);
            }
            
            // Refresh products list
            const { data, error } = await supabase.from('Products').select('*');
            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data);
            }
            
            alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully!');
            e.target.reset(); // Reset form fields
        } catch (error) {
            console.error('Error adding/updating product:', error);
        } finally {
            setIsLoading(prev => ({ ...prev, addProduct: false }));
        }
    };

    const deleteProduct = async (productId) => {
        setIsLoading(prev => ({ 
            ...prev, 
            deleteProduct: { [productId]: true } 
        }));
        try {
            await supabase.from('Products').delete().eq('id', productId);
            const { data, error } = await supabase.from('Products').select('*');
            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
        } finally {
            setIsLoading(prev => ({ ...prev, deleteProduct: false }));
        }
    };

    const editProduct = (productId) => {
        const product = products.find(p => p.id === productId);
        if (product) {
            setEditingProduct(product);
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productStatus').value = product.status;
            document.getElementById('productDescription').value = product.description;
        }
    };

    const updateStats = () => {
        setActiveOrders(3); // Placeholder value; replace with actual logic
        setPendingChats(0); // Placeholder value; replace with actual logic
    };
    const countPendingChats = (chatSessions) => {
        const unreadCount = chatSessions.reduce((acc, session) => acc + session.unreadCount, 0);
        setPendingChats(unreadCount);
    };

    const openSlideshowManagement = async () => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center';
        modal.innerHTML = `
            <div class="bg-white rounded-lg p-6 w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto relative">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-2xl font-bold">Manage Slideshow Images</h2>
                    <button class="close-modal text-red-500 hover:text-red-700 absolute top-4 right-4">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-4" id="existingSlideImages"></div>
                <div class="mt-6">
                    <label class="block text-gray-700 mb-2">Add New Slideshow Image</label>
                    <input type="file" id="newSlideshowImage" accept="image/*" 
                           class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-amber-500"/>
                    <button id="uploadSlideshowImage" 
                            class="mt-4 bg-amber-500 text-white px-6 py-2 rounded hover:bg-amber-600 transition-colors">
                        Upload Image
                    </button>
                </div>
            </div>
        `;
    
        document.body.appendChild(modal);
    
        const existingImagesContainer = modal.querySelector('#existingSlideImages');
        
        // Fetch existing slides from Supabase
        const { data: slides, error } = await supabase.from('Slides').select('*');
        
        if (error) {
            console.error('Error fetching slides:', error);
        } else {
            slides.forEach((slide, index) => {
                const imageWrapper = document.createElement('div');
                imageWrapper.className = 'relative';
                imageWrapper.innerHTML = `
                    <img src="${slide.imageUrl}" alt="Slide ${index + 1}" 
                         class="w-full h-40 object-cover rounded">
                    <button data-id="${slide.id}" class="deleteSlideImage absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600">
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                `;
                existingImagesContainer.appendChild(imageWrapper);
            });
        }
    
        modal.querySelector('.close-modal').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        
    
        existingImagesContainer.addEventListener('click', async (e) => {
            const deleteBtn = e.target.closest('.deleteSlideImage');
            if (deleteBtn) {
                const slideId = deleteBtn.dataset.id;
                try {
                    await supabase.from('Slides').delete().eq('id', slideId);
                    document.body.removeChild(modal);
                    openSlideshowManagement();
                } catch (error) {
                    console.error('Error deleting slide:', error);
                }
            }
        });
    
        modal.querySelector('#uploadSlideshowImage').addEventListener('click', async () => {
            const fileInput = modal.querySelector('#newSlideshowImage');
            const file = fileInput.files[0];
            
            if (file) {
                try {
                    // Upload image to Supabase storage
                    const fileName = `${Date.now()}_${file.name}`;
                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('images')
                        .upload(`slides/${fileName}`, file);
    
                    if (uploadError) {
                        console.error('Error uploading image:', uploadError);
                        return;
                    }
    
                    // Get public URL
                    const { data: urlData } = supabase.storage
                        .from('images')
                        .getPublicUrl(`slides/${fileName}`);
    
                    // Save slide URL to Supabase table
                    const { error: insertError } = await supabase.from('Slides').insert([
                        { imageUrl: urlData.publicUrl }
                    ]);
    
                    if (insertError) {
                        console.error('Error saving slide:', insertError);
                        return;
                    }
    
                    document.body.removeChild(modal);
                    openSlideshowManagement();
                } catch (error) {
                    console.error('Error uploading slide:', error);
                }
            } else {
                alert('Please select an image to upload');
            }
        });
    };

    const openChatModal = () => {
        setIsChatModalOpen(true);
    };

    const closeChatModal = () => {
        setIsChatModalOpen(false);
    };
    
    

    return (
        <div className="bg-amber-50 min-h-screen">
            <nav className="bg-gradient-to-r from-amber-500 to-amber-600 shadow-2xl mb-8">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                    <div className="flex items-center">
                        <img src={logo} alt="Logo" className="h-10 mr-4 rounded-full" />
                        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-wider">Admin Dashboard</h1>
                    </div>
                    <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 w-full md:w-auto">
                        <button 
                            onClick={() => navigate('/')} 
                            className="w-full md:w-auto text-white hover:bg-amber-700 px-4 py-2 rounded-md transition-all duration-300 ease-in-out text-center"
                        >
                            Back to Home
                        </button>
                        {isAdmin && (
                            <button 
                                onClick={handleLogout} 
                                className="w-full md:w-auto bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-md flex items-center justify-center transition-all duration-300 ease-in-out"
                            >
                                <FontAwesomeIcon icon={faSignOutAlt} className="mr-2" /> 
                                Logout
                            </button>
                        )}
                    </div>
                </div>
            </nav>
    
            {!isAdmin ? (
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold text-center mb-6">Admin Login</h2>
                        <form onSubmit={handleLogin}>
                            <div className="mb-4">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Password"
                                    className="border border-gray-300 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    required
                                />
                            </div>
                            {loginError && <div className="text-red-500 text-sm mb-4 text-center">{loginError}</div>}
                            <button 
                                type="submit" 
                                disabled={isLoading.login}
                                className={`bg-amber-500 text-white p-3 rounded w-full hover:bg-amber-600 transition-colors flex items-center justify-center ${isLoading.login ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading.login ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                                        Logging in...
                                    </>
                                ) : (
                                    'Login'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {[
                            { 
                                title: 'Total Products', 
                                value: totalProducts, 
                                icon: faBoxOpen, 
                                color: 'bg-blue-100 text-blue-600',
                                onClick: scrollToManageProducts 
                            },
                            { 
                                title: 'Active Orders', 
                                value: activeOrders, 
                                icon: faShoppingCart, 
                                color: 'bg-green-100 text-green-600',
                                onClick: handleActiveOrdersClick
                                 
                            },
                            { 
                                title: 'Pending Chats', 
                                value: pendingChats, 
                                icon: faComments, 
                                color: 'bg-purple-100 text-purple-600',
                                onClick: openChatModal 
                            }
                        ].map(({ title, value, icon, color, onClick }) => (
                            <div 
                                key={title} 
                                className={`${color} p-4 md:p-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 cursor-pointer`}
                                onClick={onClick}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xs md:text-sm font-semibold uppercase tracking-wide">{title}</h3>
                                        <p className="text-2xl md:text-3xl font-bold mt-2">{value}</p>
                                    </div>
                                    <FontAwesomeIcon icon={icon} className="text-2xl md:text-3xl opacity-50" />
                                </div>
                            </div>
                        ))}
                    </div>
    
                    <div className="bg-white rounded-lg shadow-xl p-4 md:p-6 mb-4">
                        <h2 className="text-xl md:text-2xl font-bold mb-4">{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                        <form id="addProductForm" onSubmit={handleAddOrUpdateProduct}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm">Product Name</label>
                                    <input type="text" id="productName" required className="w-full p-2 border rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm">Price (₦)</label>
                                    <input type="number" id="productPrice" required min="0" className="w-full p-2 border rounded text-sm" />
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm">Category</label>
                                    <select id="productCategory" required className="w-full p-2 border rounded text-sm">
                                        <option value="cakes">Cakes</option>
                                        <option value="pastries">Pastries</option>
                                        <option value="bread">Bread</option>
                                        <option value="cookies">Cookies</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm">Status</label>
                                    <select id="productStatus" required className="w-full p-2 border rounded text-sm">
                                        <option value="available">Available</option>
                                        <option value="soldout">Sold Out</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-700 mb-2 text-sm">Image</label>
                                    <input type="file" id="productImage" accept="image/*" className="w-full p-2 border rounded text-sm" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-gray-700 mb-2 text-sm">Description</label>
                                    <textarea id="productDescription" required rows="3" className="w-full p-2 border rounded text-sm"></textarea>
                                </div>
                            </div>
                            <button 
                                type="submit" 
                                disabled={isLoading.addProduct}
                                className={`mt-4 w-full md:w-auto bg-amber-500 text-white px-6 py-2 rounded hover:bg-amber-600 transition-colors flex items-center justify-center ${isLoading.addProduct ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isLoading.addProduct ? (
                                    <>
                                        <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin" />
                                        {editingProduct ? 'Updating...' : 'Adding...'}
                                    </>
                                ) : (
                                    editingProduct ? 'Update Product' : 'Add Product'
                                )}
                            </button>
                        </form>
                    </div>
    
                    <div className="bg-white rounded-lg shadow-xl p-4 md:p-6">
                        <h2 className="text-xl md:text-2xl font-bold mb-4">Manage Products</h2>
                        <button onClick={openSlideshowManagement} className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 mb-4 w-full md:w-auto">
                            Manage Slideshow
                        </button>
                        <div className="overflow-x-auto">
                            <table className="min-w-full w-full">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                        <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Price</th>
                                        <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Status</th>
                                        <th className="px-2 md:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading.products ? (
                                        <tr>
                                            <td colSpan="4" className="text-center py-4">
                                                <FontAwesomeIcon icon={faSpinner} className="mr-2 animate-spin text-2xl" />
                                                Loading Products...
                                            </td>
                                        </tr>
                                    ) : (
                                        products.map(product => (
                                            <tr key={product.id} className="border-b">
                                                <td className="px-2 md:px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <img className="h-10 w-10 rounded-full object-cover" src={product.image} alt={product.name} />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                            <div className="text-sm text-gray-500 md:hidden">{product.category} - ₦{product.price}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-2 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                    <div className="text-sm text-gray-900">₦{product.price}</div>
                                                </td>
                                                <td className="px-2 md:px-6 py-4 whitespace-nowrap hidden md:table-cell">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                        {product.status}
                                                    </span>
                                                </td>
                                                <td className="px-2 md:px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-3">
                                                        <button 
                                                            onClick={() => editProduct(product.id)} 
                                                            className="text-amber-600 hover:text-amber-900 text-sm md:text-base"
                                                        >
                                                            <FontAwesomeIcon icon={faEdit} className="mr-1" /> Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => deleteProduct(product.id)} 
                                                            disabled={isLoading.deleteProduct && isLoading.deleteProduct[product.id]}
                                                            className={`text-red-600 hover:text-red-900 text-sm md:text-base flex items-center ${isLoading.deleteProduct && isLoading.deleteProduct[product.id] ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        >
                                                            {isLoading.deleteProduct && isLoading.deleteProduct[product.id] ? (
                                                                <>
                                                                    <FontAwesomeIcon icon={faSpinner} className="mr-1 animate-spin" />
                                                                    Deleting...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <FontAwesomeIcon icon={faTrash} className="mr-1" /> Delete
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
    
            {/* Chat Modal */}
            <AdminChatModal 
                isOpen={isChatModalOpen} 
                onClose={closeChatModal} 
                onPendingChatsUpdate={countPendingChats}
            />
        </div>
    );
};

export default Admin;