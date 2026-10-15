import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Plus, Globe, Lock, Users, RotateCw, Skull, Sparkles, BookOpen, Layers } from 'lucide-react';
import { cn } from '../lib/cn';

export default function HomeHub({
  nickname,
  setNickname,
  publicRooms,
  onJoinRoom,
  onCreateRoom,
  onRefreshRooms,
  onOpenGuide,
}) {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [createRoomName, setCreateRoomName] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [initialHandCards, setInitialHandCards] = useState(3);

  // Inicializa nome da sala sugerido ao mudar nickname
  useEffect(() => {
    if (!createRoomName && nickname) {
      setCreateRoomName(`SALA DE ${nickname.toUpperCase()}`);
    }
  }, [nickname]);

  const handleJoinWithCode = (e) => {
    e?.preventDefault();
    const cleanCode = roomCodeInput.trim().toUpperCase();
    if (!cleanCode) return;
    onJoinRoom(cleanCode);
  };

  const handleCreateRoom = (e) => {
    e?.preventDefault();
    onCreateRoom({
      roomName: createRoomName.trim() || `SALA DE ${(nickname || 'CONDENADO').toUpperCase()}`,
      isPublic,
      initialHandCards,
    });
  };

  return (
    <div className="flex-1 min-h-0 flex overflow-y-auto overflow-x-hidden p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-4xl space-y-4 sm:space-y-6 m-auto"
      >
        {/* Título Principal */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold-aged/40 bg-black/60 text-gold-aged text-[10px] sm:text-[11px] font-mono tracking-wider sm:tracking-widest uppercase mb-2 shadow-[0_0_15px_rgba(212,175,55,0.2)]">
            <Sparkles size={13} className="text-gold-aged animate-spin" style={{ animationDuration: '8s' }} />
            MULTIJOGADOR TÁTICO EM TEMPO REAL
          </div>
          <h1 className="font-grimoire font-extrabold text-3xl sm:text-5xl tracking-[0.15em] sm:tracking-[0.25em] text-parchment drop-shadow-[0_0_20px_rgba(220,38,38,0.7)]">
            STRIKE<span className="text-blood-bright">/</span>VOID
          </h1>
          <p className="font-typewriter text-parchment-dark text-[11px] sm:text-sm tracking-wider sm:tracking-widest max-w-lg mx-auto">
            ROLETA SIMULTÂNEA · FACAS · PAREDES · REVERSOS
          </p>
          <div className="pt-2">
            <button
              id="btn-hub-guide"
              type="button"
              onClick={onOpenGuide}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blood-bright/60 bg-blood/20 hover:bg-blood/40 hover:border-blood-bright text-parchment text-xs font-mono tracking-wider transition-all shadow-[0_0_12px_rgba(220,38,38,0.3)] active:scale-95"
            >
              <BookOpen size={13} className="text-blood-bright" /> COMO JOGAR (MANUAL DO CONDENADO)
            </button>
          </div>
        </div>

        {/* Barra de Identidade do Jogador */}
        <div className="rounded-lg border-2 border-stone-800 bg-wood-dark/80 p-4 shadow-xl backdrop-blur-sm max-w-lg mx-auto">
          <label className="block font-grimoire font-bold text-xs tracking-wider text-gold-aged mb-1.5 flex items-center gap-1.5">
            <Skull size={14} className="text-blood-bright" />
            SEU NOME / PSEUDÔNIMO
          </label>
          <div className="flex gap-2">
            <input
              id="input-nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              placeholder="Digite seu nome..."
              className="flex-1 min-h-[44px] bg-black/70 border-2 border-iron/80 rounded px-3 py-2 font-typewriter text-parchment text-base sm:text-sm outline-none focus:border-gold-aged transition-colors"
            />
          </div>
        </div>

        {/* Grid de Ações: Entrar com Código & Criar Sala */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card: Entrar com Código */}
          <div className="rounded-lg border-2 border-stone-800 bg-gradient-to-b from-wood-mid to-wood-dark p-4 sm:p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded bg-black/60 border border-gold-aged/50 text-gold-aged">
                  <LogIn size={18} />
                </div>
                <div>
                  <h2 className="font-grimoire font-extrabold text-base tracking-wider text-parchment">
                    ENTRAR COM CÓDIGO
                  </h2>
                  <p className="text-[11px] font-mono text-parchment-dark">
                    Possui o convite de 4 caracteres de uma sala?
                  </p>
                </div>
              </div>

              <form onSubmit={handleJoinWithCode} className="mt-4 space-y-3">
                <input
                  id="input-room-code"
                  value={roomCodeInput}
                  onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                  maxLength={4}
                  placeholder="EX: ABCD"
                  className="w-full text-center font-mono font-extrabold text-2xl tracking-[0.35em] uppercase bg-black/80 border-2 border-iron rounded-md py-2.5 text-gold-aged outline-none focus:border-gold-aged placeholder:text-stone-700 shadow-inner"
                />

                <button
                  type="submit"
                  id="btn-join-code"
                  disabled={roomCodeInput.trim().length !== 4}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded border-2 border-gold-aged bg-blood/80 hover:bg-blood disabled:opacity-40 disabled:hover:bg-blood/80 text-parchment font-grimoire font-bold tracking-wider text-sm transition-all shadow-[0_0_15px_rgba(139,0,0,0.4)]"
                >
                  <LogIn size={16} /> ENTRAR NA SALA
                </button>
              </form>
            </div>
          </div>

          {/* Card: Criar Sala */}
          <div className="rounded-lg border-2 border-stone-800 bg-gradient-to-b from-wood-mid to-wood-dark p-4 sm:p-5 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 rounded bg-black/60 border border-gold-aged/50 text-gold-aged">
                  <Plus size={18} />
                </div>
                <div>
                  <h2 className="font-grimoire font-extrabold text-base tracking-wider text-parchment">
                    CRIAR NOVA SALA
                  </h2>
                  <p className="text-[11px] font-mono text-parchment-dark">
                    Você será o líder (2 a 8 jogadores, com suporte a bots).
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreateRoom} className="mt-4 space-y-3">
                <input
                  id="input-room-name"
                  value={createRoomName}
                  onChange={(e) => setCreateRoomName(e.target.value)}
                  maxLength={24}
                  placeholder="Nome da sua mesa..."
                  className="w-full min-h-[44px] bg-black/80 border-2 border-iron rounded-md px-3 py-2 font-typewriter text-parchment text-base sm:text-sm outline-none focus:border-gold-aged placeholder:text-stone-700"
                />

                {/* Seletor de Cartas Iniciais (1 a 5, padrão 3) */}
                <div className="rounded border border-iron/70 bg-black/60 p-2.5">
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="text-parchment-dark flex items-center gap-1">
                      <Layers size={13} className="text-gold-aged" /> CARTAS INICIAIS:
                    </span>
                    <span className="text-gold-aged font-bold">{initialHandCards} {initialHandCards === 1 ? 'carta' : 'cartas'}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setInitialHandCards(num)}
                        className={cn(
                          'py-1.5 rounded text-xs font-mono font-bold transition-all border',
                          initialHandCards === num
                            ? 'border-gold-aged bg-gold-aged/25 text-amber-200 shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                            : 'border-stone-800 bg-stone-900/60 text-stone-400 hover:text-parchment hover:border-stone-600'
                        )}
                      >
                        {num} {num === 3 && <span className="text-[9px] block text-stone-400 font-normal">Padrão</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Seletor Pública / Privada */}
                <div className="flex rounded border border-iron/70 bg-black/60 p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2 rounded text-xs font-mono font-bold transition-all ${
                      isPublic
                        ? 'bg-gold-aged/20 text-gold-aged border border-gold-aged/60 shadow-[0_0_10px_rgba(212,175,55,0.25)]'
                        : 'text-parchment-dark hover:text-parchment'
                    }`}
                  >
                    <Globe size={13} /> PÚBLICA
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2 rounded text-xs font-mono font-bold transition-all ${
                      !isPublic
                        ? 'bg-blood/30 text-blood-bright border border-blood-bright/60 shadow-[0_0_10px_rgba(220,38,38,0.25)]'
                        : 'text-parchment-dark hover:text-parchment'
                    }`}
                  >
                    <Lock size={13} /> PRIVADA
                  </button>
                </div>

                <button
                  type="submit"
                  id="btn-create-room"
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded border-2 border-gold-aged bg-wood-dark hover:bg-gold-aged/20 text-gold-aged font-grimoire font-bold tracking-wider text-sm transition-all shadow-[0_0_15px_rgba(212,175,55,0.15)]"
                >
                  <Plus size={16} /> CRIAR SALA COMO HOST
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Card: Lista de Salas Públicas Abertas */}
        <div className="rounded-lg border-2 border-stone-800 bg-black/60 backdrop-blur-sm p-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-iron/50 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Globe size={16} className="text-gold-aged" />
              <h3 className="font-grimoire font-extrabold text-sm tracking-widest text-parchment">
                SALAS PÚBLICAS ABERTAS
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-wood-dark border border-iron text-parchment-dark">
                {publicRooms.length} online
              </span>
            </div>
            <button
              id="btn-refresh-rooms"
              onClick={onRefreshRooms}
              className="flex items-center gap-1 text-[11px] font-mono text-parchment-dark hover:text-gold-aged transition-colors"
              title="Atualizar lista de salas"
            >
              <RotateCw size={12} /> Atualizar
            </button>
          </div>

          {publicRooms.length === 0 ? (
            <div className="py-8 text-center text-parchment-dark/70 font-mono text-xs space-y-1">
              <div>Nenhuma sala pública aberta no momento.</div>
              <div className="text-[10px] text-stone-500">Crie uma nova sala acima ou entre com um código privado!</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
              {publicRooms.map((r) => (
                <div
                  key={r.code}
                  className="flex items-center justify-between rounded border border-iron/70 bg-wood-dark/70 hover:border-gold-aged/70 p-2.5 transition-colors group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-typewriter text-xs text-parchment truncate font-bold">
                      {r.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-[11px] font-extrabold tracking-widest text-gold-aged bg-black/70 px-1.5 py-0.5 rounded border border-gold-aged/40">
                        {r.code}
                      </span>
                      <span className="font-mono text-[10px] text-parchment-dark flex items-center gap-1">
                        <Users size={11} /> {r.playerCount}/{r.maxPlayers}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onJoinRoom(r.code)}
                    className="shrink-0 min-h-[44px] sm:min-h-0 px-3 py-2 sm:py-1.5 rounded border border-gold-aged bg-blood/70 group-hover:bg-blood text-parchment font-grimoire font-bold text-xs tracking-wider transition-colors"
                  >
                    ENTRAR
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
