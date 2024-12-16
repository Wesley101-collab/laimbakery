import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faSun, faMoon, faUser, faComments, faMapMarkerAlt, faPhone, 
    faChevronLeft, faChevronRight, faEnvelope, faBars, faTimes 
} from '@fortawesome/free-solid-svg-icons';
import logo from './images/logo.jpg';
const Home = () => {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const [slides, setSlides] = useState([]);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const modalRef = useRef(null);
    const footerRef = useRef(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // New state for categories and search
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // Categories
    const CATEGORIES = [
        'All', 
        'Cakes', 
        'Pastries', 
        'Bread', 
        'Cookies'
    ];

    // Filter and search logic
    useEffect(() => {
        let result = products;

        // Category filter
        if (selectedCategory !== 'All') {
            result = result.filter(product => 
                product.category.toLowerCase() === selectedCategory.toLowerCase()
            );
        }

        // Search filter
        if (searchTerm) {
            result = result.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredProducts(result);
    }, [products, selectedCategory, searchTerm]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };


    const handleProductClick = (product) => {
        setSelectedProduct(product);
    };

    const closeModal = (e) => {
        if (e.target === modalRef.current) {
            setSelectedProduct(null);
        }
    };

    const scrollToContact = () => {
        if (footerRef.current) {
            footerRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleEmailClick = (email) => {
        // This will open the user's default email client
        window.location.href = `mailto:${email}`;
    };

    const getSlideConfig = useCallback(() => {
        const baseConfig = {
            mobile: {
                width: '100%',
                height: windowWidth < 640 ? '250px' : '400px',
                objectFit: 'cover'
            },
            desktop: {
                width: '100%',
                height: '600px',
                objectFit: 'cover'
            }
        };
        return windowWidth < 768 ? baseConfig.mobile : baseConfig.desktop;
    }, [windowWidth]);

    useEffect(() => {
        const handleResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const fetchSlides = async () => {
            const { data, error } = await supabase
                .from('Slides')
                .select('imageUrl');
            
            if (error) {
                console.error('Error fetching slides:', error);
            } else {
                const slideUrls = data.map(slide => slide.imageUrl);
                setSlides(slideUrls);
            }
        };

        const fetchProducts = async () => {
            const { data, error } = await supabase
                .from('Products')
                .select('*');
            
            if (error) {
                console.error('Error fetching products:', error);
            } else {
                setProducts(data);
            }
        };

        fetchSlides();
        fetchProducts();
    }, []);

    useEffect(() => {
        let intervalId;
        if (slides.length > 1) {
            intervalId = setInterval(() => {
                setCurrentSlide((prev) => (prev + 1) % slides.length);
            }, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [slides.length]);

    const nextSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, [slides.length]);

    const prevSlide = useCallback(() => {
        setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    }, [slides.length]);

    const toggleTheme = () => {
        setIsDarkMode((prev) => !prev);
        document.documentElement.classList.toggle('dark', !isDarkMode);
    };

    const inquireProduct = (product) => {
        const createProductInquirySession = async () => {
            try {
                // Get the existing chat session ID or create a new one
                const existingSessionId = localStorage.getItem('chatSessionId');
                const sessionId = existingSessionId || 
                    Date.now().toString(36) + Math.random().toString(36).substr(2);
    
                // Store product inquiry details
                localStorage.setItem('productInquiry', JSON.stringify({
                    productName: product.name,
                    productImage: product.image,
                    productPrice: product.price,
                    timestamp: new Date().toISOString() // Add timestamp to track latest inquiry
                }));
    
                // Always save/update the session ID
                localStorage.setItem('chatSessionId', sessionId);
    
                navigate('/chat');
            } catch (error) {
                console.error('Error creating inquiry session:', error);
            }
        };
    
        createProductInquirySession();
    };

    const slideConfig = getSlideConfig();

    return (
        <div className={`min-h-screen flex flex-col bg-amber-50 dark:bg-dark-bg dark:text-dark-text transition-colors ${isDarkMode ? 'dark' : ''}`}>
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white dark:bg-dark-card shadow-lg">
                <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <img 
                            src={logo} 
                            alt="LAIM BAKERY Logo" 
                            className="h-8 w-8 md:h-10 md:w-10 rounded-full"
                            onError={(e) => {
                                console.error('Error loading logo:', e);
                                e.target.onerror = null;
                            }} 
                        />
                        <h1 className="text-lg md:text-2xl font-bold text-amber-600 dark:text-dark-accent">
                            <Link to="/">LAIM BAKERY AND PASTRY</Link>
                        </h1>
                    </div>
                    
                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        <button 
                            onClick={scrollToContact} 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Contact Information"
                        >
                            <FontAwesomeIcon icon={faEnvelope} className="text-base text-gray-600 dark:text-gray-300" />
                        </button>
                        <button 
                            onClick={toggleTheme} 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Toggle Theme"
                        >
                            <FontAwesomeIcon icon={isDarkMode ? faMoon : faSun} className="text-base text-amber-500 dark:text-dark-accent" />
                        </button>
                        <Link 
                            to="/admin" 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Admin Panel"
                        >
                            <FontAwesomeIcon icon={faUser} className="text-base text-gray-600 dark:text-gray-300" />
                        </Link>
                        <Link 
                            to="/chat" 
                            className="p-2 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Customer Support"
                        >
                            <FontAwesomeIcon icon={faComments} className="text-base text-gray-600 dark:text-gray-300" />
                        </Link>
                    </div>
    
                    {/* Mobile Navigation */}
                    <div className="flex md:hidden items-center gap-2">
                        <button 
                            onClick={toggleTheme} 
                            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" 
                            title="Toggle Theme"
                        >
                            <FontAwesomeIcon icon={isDarkMode ? faMoon : faSun} className="text-sm text-amber-500 dark:text-dark-accent" />
                        </button>
                        <button 
                            onClick={toggleMenu}
                            className="p-1 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            <FontAwesomeIcon 
                                icon={isMenuOpen ? faTimes : faBars} 
                                className="text-sm text-gray-600 dark:text-gray-300"
                            />
                        </button>
                    </div>
    
                    {/* Mobile Menu */}
                    {isMenuOpen && (
                        <div className="absolute top-full left-0 right-0 bg-white dark:bg-dark-card shadow-lg md:hidden">
                            <div className="p-4 space-y-4">
                                <button 
                                    onClick={() => {
                                        scrollToContact();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faEnvelope} className="text-gray-600 dark:text-gray-300" />
                                    <span className="text-gray-800 dark:text-gray-200">Contact Us</span>
                                </button>
                                <Link 
                                    to="/admin"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faUser} className="text-gray-600 dark:text-gray-300" />
                                    <span className="text-gray-800 dark:text-gray-200">Admin Panel</span>
                                </Link>
                                <Link 
                                    to="/chat"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="w-full flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <FontAwesomeIcon icon={faComments} className="text-gray-600 dark:text-gray-300" />
                                    <span className="text-gray-800 dark:text-gray-200">Customer Support</span>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
    
            <div className="relative w-full overflow-hidden mb-8 mt-16" style={slideConfig}>
                <div 
                    className="flex transition-transform duration-500 h-full" 
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.length ? (
                        slides.map((imageUrl, index) => (
                            <div key={index} className="w-full h-full flex-shrink-0">
                                <img 
                                    src={imageUrl} 
                                    alt={`Slide ${index + 1}`} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                        ))
                    ) : (
                        <div className="w-full h-full flex-shrink-0 flex justify-center items-center bg-gray-200">
                            <p>No Slides Available</p>
                        </div>
                    )}
                </div>
    
                {slides.length > 1 && (
                    <>
                        <button 
                            onClick={prevSlide} 
                            className="absolute top-1/2 left-2 md:left-4 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronLeft} className="text-sm md:text-base" />
                        </button>
                        <button 
                            onClick={nextSlide} 
                            className="absolute top-1/2 right-2 md:right-4 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full hover:bg-black/75 transition-colors"
                        >
                            <FontAwesomeIcon icon={faChevronRight} className="text-sm md:text-base" />
                        </button>
                    </>
                )}
    
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 md:p-8">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">Fresh Bakes Daily</h2>
                    <p className="text-xs md:text-base text-gray-200">Artisanal Pastries & Custom Cakes</p>
                </div>
            </div>
    
            <div className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
                {/* Search and Category Filtering Section */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                {/* Search Input */}
                <div className="w-full max-w-md">
                    <input 
                        type="text" 
                        placeholder="Search products..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2 border rounded-full bg-white dark:bg-dark-card dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                </div>

                {/* Category Selector */}
                <div className="flex gap-2 overflow-x-auto">
                    {CATEGORIES.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                selectedCategory === category 
                                    ? 'bg-amber-500 text-white' 
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>
            
                  {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredProducts.length > 0 ? (
                    filteredProducts.map(product => (
                        <div 
                            key={product.id} 
                            className="bg-white dark:bg-dark-card p-4 md:p-6 rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer"
                            onClick={() => handleProductClick(product)}
                        >
                            <img 
                                src={product.image} 
                                alt={product.name} 
                                className="w-full h-36 md:h-48 object-cover rounded-lg mb-2 md:mb-4" 
                            />
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-base md:text-lg font-semibold dark:text-dark-text truncate">
                                    {product.name}
                                </h3>
                                <span className="text-sm md:text-base text-amber-600 dark:text-dark-accent font-bold">
                                    ₦{product.price}
                                </span>
                            </div>
                            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 md:mb-4 line-clamp-2">
                                {product.description}
                            </p>
                            <div className="flex justify-between items-center">
                                <span 
                                    className={`px-2 py-1 rounded-full text-xs ${
                                        product.status === 'available' 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                    }`}
                                >
                                    {product.status === 'available' ? 'Available' : 'Sold Out'}
                                </span>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        inquireProduct(product);
                                    }} 
                                    className="px-2 py-1 text-xs md:px-3 md:py-1 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
                                >
                                    Inquire
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center p-6 rounded-lg bg-white dark:bg-dark-card shadow-lg">
                        <h3 className="text-lg font-semibold dark:text-dark-text">No Products Found</h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {products.length > 0 
                                ? "No products match your search or selected category." 
                                : "Currently, there are no products available."}
                        </p>
                    </div>
                )}
            </div>
        </div>
    
            {/* Product Modal */}
        {selectedProduct && (
            <div 
                ref={modalRef}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={closeModal}
            >
                <div className="bg-white dark:bg-dark-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" 
                     onClick={e => e.stopPropagation()}>
                    <div className="p-6">
                        <img 
                            src={selectedProduct.image} 
                            alt={selectedProduct.name} 
                            className="w-full h-64 object-cover rounded-lg mb-4" 
                        />
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl md:text-2xl font-bold dark:text-dark-text">
                                {selectedProduct.name}
                            </h2>
                            <span className="text-lg md:text-xl text-amber-600 dark:text-dark-accent font-bold">
                                ₦{selectedProduct.price}
                            </span>
                        </div>
                        <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mb-6">
                            {selectedProduct.description}
                        </p>
                        <div className="flex justify-between items-center">
                            <span 
                                className={`px-3 py-1 rounded-full text-sm ${
                                    selectedProduct.status === 'available' 
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' 
                                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                                }`}
                            >
                                {selectedProduct.status === 'available' ? 'Available' : 'Sold Out'}
                            </span>
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => inquireProduct(selectedProduct)}
                                    className="px-4 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors"
                                >
                                    Inquire Now
                                </button>
                                <button 
                                    onClick={() => setSelectedProduct(null)}
                                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    
            <footer ref={footerRef} className="bg-amber-100 dark:bg-dark-card transition-colors">
                <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                        <div className="text-center md:text-left">
                            <img 
                                                            src={logo}
                                alt="LAIM BAKERY Logo" 
                                className="h-16 md:h-24 mx-auto md:mx-0 mb-2 md:mb-4 rounded-full"
                                onError={(e) => {
                                    console.error('Error loading logo:', e);
                                    e.target.onerror = null;
                                }}
                            />
                            <h3 className="text-lg md:text-xl font-bold text-amber-600 dark:text-dark-accent mb-1 md:mb-2">
                                LAIM BAKERY AND PASTRY
                            </h3>
                            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                                Crafting delicious moments, one pastry at a time.
                            </p>
                        </div>
    
                        <div className="text-center md:text-right">
                            <h4 className="text-base md:text-lg font-bold text-amber-600 dark:text-dark-accent mb-2 md:mb-4">
                                Contact Us
                            </h4>
                            <div className="space-y-1 md:space-y-2">
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-amber-500 mr-2 text-sm" />
                                    15 Isiak Adetunji Adeleke Free way,<br />
                                    Oke Fia Osogbo
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faPhone} className="text-amber-500 mr-2 text-sm" />
                                    07074588769
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300">
                                    <FontAwesomeIcon icon={faPhone} className="text-amber-500 mr-2 text-sm" />
                                    07074588770
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-amber-700 transition-colors"
                                   onClick={() => handleEmailClick('info@laimbakery.com')}>
                                    <FontAwesomeIcon icon={faEnvelope} className="text-amber-500 mr-2 text-sm" />
                                    info@laimbakery.com
                                </p>
                                <p className="text-xs md:text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-amber-700 transition-colors"
                                   onClick={() => handleEmailClick('reservations@laimbakery.com')}>
                                    <FontAwesomeIcon icon={faEnvelope} className="text-amber-500 mr-2 text-sm" />
                                    reservations@laimbakery.com
                                </p>
                            </div>
                        </div>
                    </div>
    
                    <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-amber-200 dark:border-gray-700">
                        <p className="text-center text-xs md:text-sm text-gray-600 dark:text-gray-400">
                            © 2024 LAIM BAKERY AND PASTRY. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
    ;
};

export default Home;