export default function Navbar() {
    return (
        <nav className="flex h-16 w-full items-center justify-between border-b border-solid bg-background px-6 dark:border-white/[.145] dark:bg-[#111]">
            <div className="flex items-center gap-4 transition-all duration-300">
                    <button className="hover:scale-120 transition-all duration-300">Inicio</button>
                    <button className="hover:scale-120 transition-all duration-300">Catalogo</button>
                    <button className="hover:scale-120 transition-all duration-300">Contacto</button>
                    <button className="hover:scale-120 transition-all duration-300">Info</button>
            </div>
            <h1>hola</h1>


        </nav>
    )
}